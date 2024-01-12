import { env } from "node:process";
import { defineConfig } from "vite";

import { preprocessor, react } from "./vite.config.compiler.js";
import { internalIpV4 } from "./vite.config.ip.js";

const mobile = !!/android|ios/.exec(env.TAURI_ENV_PLATFORM);

/** @type {import("vite").UserConfig} */
export default defineConfig(async () => ({
    plugins: [react(), preprocessor({
        directives: [(context) => ({
            lex(state, comment) {
                const match = comment?.match(/#(if|else|elif|endif)\s?(.*)/);
                if (match) return { type: match[1], value: match[2]?.trim() };
            },
            parse(state, token) {
                if (token.type === "if" || token.type === "elif" || token.type === "else") {
                    const node = { type: "IfStatement", test: token.value, consequent: [], alternate: [], kind: token.type };
                    state.current++;

                    while (state.current < state.tokens.length) {
                        const nextToken = state.tokens[state.current];

                        if (nextToken.type === "elif" || nextToken.type === "else") {
                            node.alternate.push(state.walk(state));
                            break;
                        } else if (nextToken.type === "endif") {
                            state.current++; // Skip 'endif'
                            break;
                        } else {
                            node.consequent.push(state.walk(state));
                        }
                    }
                    return node;
                }
            },
            transform(state, node) {
                if (node.type === "IfStatement") {
                    const test = (node.test?.trim() ?? "true")
                        .replace(/([^=!])=([^=])/g, "$1==$2")
                        .replace(/\b(\w+)\b/g, (match, name) => JSON.stringify(context?.env[name] ?? false)); // not nullable

                    const body = new Function(`return (${test});`)() !== false ? node.consequent : node.alternate;
                    return {
                        type: "Program",
                        body: body.map(node => state.walk(state, node)).filter(Boolean)
                    };
                }
            },
            generate(state, node, comment) {
                if (node.type === "IfStatement" && comment) {
                    let code = node.kind === "else" ?
                        `${comment.start} ${node.kind} ${comment.end}` :
                        `${comment.start} #${node.kind} ${node.test}${comment.end}`;

                    code += `\n${node.consequent.map(node => state.walk(state, node)).join("\n")}`;

                    code += node.alternate.length
                        ? `\n${node.alternate.map(node => state.walk(state, node)).join("\n")}`
                        : `\n${comment.start} #endif ${comment.end}`;

                    return code;
                }
            }
        })]
    })],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: mobile ? "0.0.0.0" : false,
		hmr: mobile
			? {
				protocol: "ws",
				host: await internalIpV4(),
				port: 1421
			}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"]
		}
	}
}));
