import { platform, networkInterfaces } from "node:os";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { isIP } from "node:net";

function parseIp(ip) {
    const version = ip.includes(":") ? 6 : ip.includes(".") ? 4 : 0;
    if (!version) throw new Error(`Invalid IP address: ${ip}`);
    let number = 0n, info = { };

    switch (version) {
        case 4:
            ip.split('.').forEach(part => number = (number << 8n) + BigInt(parseInt(part)));
            break;
        case 6:
            if (ip.includes("%")) [ip, info.scopeid] = ip.split("%");
            ip = ip.replace(/::/g, () => ":" + ":".repeat(8 - ip.split(":").filter(Boolean).length));
            if (ip.includes(".")) { // ipv4 mapped
                info.ipv4mapped = true;
                ip = ip.replace(/(\d+\.\d+\.\d+\.\d+)/, (match) => {
                    const ipv4Parts = match.split('.').map(num => parseInt(num, 10).toString(16).padStart(2, "0"));
                    return ipv4Parts.slice(0, 2).join('') + ':' + ipv4Parts.slice(2).join('');
                });
            }
            ip.split(":").forEach((part) => {
                number = (number << 16n) + BigInt(parseInt(part, 16) || 0);
            });
            break;
    }

    return { number, version, ...info }
}

function parse(str) {
    const version = str.includes(":") ? 6 : str.includes(".") ? 4 : 0;
    if (!version) throw new Error(`Network is not a CIDR or IP: ${str}`);

    const numBits = version === 4 ? 32 : 128;
    const cidr = str.includes("/") ? str : `${str}/${numBits}`;
    let [ip, prefix] = cidr.split("/");
    let { number } = parseIp(ip);

    const start = number & (~0n << BigInt(numBits - prefix));
    const end = start | (~(~0n << BigInt(numBits - prefix)));

    return { single: !str.includes("/"), cidr, version, prefix, start, end };
}

function stringifyIp({ number, version, ipv4mapped, scopeid } = {}, { compress = true, hexify = false } = {}) {
    const compressIPv6 = parts => {
        let longest = null, current = null;
        parts.forEach((part, index) => {
            if (part === "0") {
                current = !current ? new Set([index]) : current.add(index);
            } else {
                if (current && (!longest || current.size > longest.size)) longest = current;
                current = null;
            }
        });

        longest = current && (!longest || current.size > longest.size) ? current : longest;
        longest?.forEach(index => parts[index] = ":");

        return parts.filter(Boolean).join(":").replace(/:{2,}/, "::");
    };

    let step = version === 4 ? 24n : 112n;
    const stepReduction = version === 4 ? 8n : 16n;
    let remain = number;
    const parts = [];

    while (step > 0n) {
        const divisor = 2n ** step;
        parts.push(remain / divisor);
        remain = number % divisor;
        step -= stepReduction;
    }
    parts.push(remain);

    if (version === 4) {
        return parts.join(".");
    } else {
        let ip = '';
        if (ipv4mapped && !hexify) {
            for (const [index, num] of parts.entries()) {
                if (index < 6) {
                    ip += `${num.toString(16)}:`;
                } else {
                    ip += `${String(num >> 8n)}.${String(num & 255n)}${index === 6 ? "." : ''}`;
                }
            }
            if (compress) {
                ip = compressIPv6(ip.split(":"));
            }
        } else {
            if (compress) {
                ip = compressIPv6(parts.map(n => n.toString(16)));
            } else {
                ip = parts.map(n => n.toString(16)).join(":");
            }
        }

        return scopeid ? `${ip}%${scopeid}` : ip;
    }
}

function normalizeIp(ip, { compress = true, hexify = false } = {}) {
    return stringifyIp(parseIp(ip), { compress, hexify });
}

function normalize(cidr, { compress = true, hexify = false } = {}) {
    if (Array.isArray(cidr)) {
        return cidr.map(entry => normalize(entry, { compress, hexify }));
    } else {
        const { start, prefix, single, version } = parse(cidr);
        return single
            ? normalizeIp(cidr, { compress, hexify })
            : `${normalizeIp(stringifyIp({ number: start, version }), { compress, hexify })}/${prefix}`;

    }
}

function contains(a, b) {
    const aNets = Array.from(new Set(Array.isArray(a) ? a : [a]));
    const bNets = Array.from(new Set(Array.isArray(b) ? b : [b]));

    const numExpected = bNets.length;
    let numFound = 0;
    for (const a of aNets) {
        const aParsed = parse(a);
        for (const b of bNets) {
            const bParsed = parse(b);

            // version mismatch
            if (aParsed.version !== bParsed.version) continue;

            if (bParsed.start >= aParsed.start && bParsed.end <= aParsed.end)
                numFound++;
        }
    }

    return numFound === numExpected;
}

export async function findGateway(platform, family) {
    switch (platform) {
        case "win32":
            // Parsing tables like this. The final metric is GatewayCostMetric + IPConnectionMetric
            //
            // DefaultIPGateway             GatewayCostMetric  Index  IPConnectionMetric
            // {"1.2.3.4", "2001:db8::1"}   {0, 256}           12     25
            // {"2.3.4.5"}                  {25}               12     55
            const parseGwTable = (gwTable, family) => {
                let [bestGw, bestMetric, bestId] = [null, null, null];

                for (let line of (gwTable || '').trim().split(/\r?\n/).splice(1)) {
                    line = line.trim();
                    const [_, gwArr, gwCostsArr, id, ipMetric] = /({.+?}) +({.+?}) +([0-9]+) +([0-9]+)/.exec(line) || [];
                    if (!gwArr) continue;

                    const gateways = (gwArr.match(/"(.+?)"/g) || []).map(match => match.substring(1, match.length - 1));
                    const gatewayCosts = (gwCostsArr.match(/[0-9]+/g) || []);

                    for (const [index, gateway] of Object.entries(gateways)) {
                        if (!gateway || isIP(gateway) !== family) continue;

                        const metric = parseInt(gatewayCosts[index]) + parseInt(ipMetric);
                        if (!bestGw || metric < bestMetric) {
                            [bestGw, bestMetric, bestId] = [gateway, metric, id];
                        }
                    }
                }

                if (bestGw) return [bestGw, bestId];
            };

            const parseIfTable = ifTable => {
                const line = (ifTable || '').trim().split("\n")[1];

                let [mac, name] = line.trim().split(/\s+/);
                mac = mac.toLowerCase();

                // try to get the interface name by matching the mac to os.networkInterfaces to avoid wmic's encoding issues
                // https://github.com/silverwind/default-gateway/issues/14
                for (const [osname, addrs] of Object.entries(networkInterfaces())) {
                    for (const addr of addrs) {
                        if (addr?.mac?.toLowerCase() === mac) {
                            return osname;
                        }
                    }
                }
                return name;
            };

            const { stdout } = await promisify(exec)(`wmic path Win32_NetworkAdapterConfiguration where IPEnabled=true get DefaultIPGateway,GatewayCostMetric,IPConnectionMetric,Index /format:table`, { windowsHide: true });
            const [gateway, id] = parseGwTable(stdout, family) || [];
            if (!gateway) throw new Error("Unable to determine default gateway");

            let name;
            if (id) {
                const { stdout } = await promisify(exec)(`wmic path Win32_NetworkAdapter where Index=${id} get NetConnectionID,MACAddress /format:table`, { windowsHide: true });
                name = parseIfTable(stdout);
            }

            return { gateway, version: family, int: name ?? null };
        default:
            break;
    }
}

export function findIp({ gateway }) {
    // Look for the matching interface in all local interfaces
    for (const addresses of Object.values(networkInterfaces())) {
        for (const { cidr } of addresses) {
            if (contains(cidr, gateway))
                return normalize(cidr).split('/')[0];
        }
    }
}

export const internalIpV6 = async () => findIp((await findGateway(platform(), 6)));

export const internalIpV4 = async () => findIp((await findGateway(platform(), 4)));
