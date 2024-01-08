import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { transform } from "@swc/core";

const runtimePublicPath = "/@react-refresh";

globalThis.__filename ??= fileURLToPath(import.meta.url);
globalThis.__dirname ??= dirname(globalThis.__filename);

const preambleCode = `import { injectIntoGlobalHook } from "__PATH__";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;`;

const resolve = createRequire(import.meta.url).resolve;
const refreshContentRegExp = /\$Refresh(?:Reg|Sig)\$\(/;

const transformWithOptions = async (id, code, target, options, reactConfig) => {
    const decorators = options?.tsDecorators ?? false;
    const parser = id.endsWith(".tsx")
        ? { syntax: "typescript", tsx: true, decorators }
        : id.endsWith(".ts") || id.endsWith(".mts")
            ? { syntax: "typescript", tsx: false, decorators }
            : id.endsWith(".jsx")
                ? { syntax: "ecmascript", jsx: true }
                : id.endsWith(".mdx")
                    ? { syntax: "ecmascript", jsx: true }
                    : undefined;
    if (!parser) return;

    let result;
    try {
        result = await transform(code, {
            filename: id,
            swcrc: false,
            configFile: false,
            sourceMaps: true,
            jsc: {
                target,
                parser,
                experimental: { plugins: options.plugins },
                transform: {
                    useDefineForClassFields: true,
                    react: reactConfig,
                },
            }
        });
    } catch (e) {
        const message = e.message;
        const fileStartIndex = message.indexOf("╭─[");
        if (fileStartIndex !== -1) {
            const match = message.slice(fileStartIndex).match(/:(\d+):(\d+)]/);
            if (match) {
                e.line = match[1];
                e.column = match[2];
            }
        }
        throw e;
    }

    return result;
};

const silenceUseClientWarning = (userConfig) => ({
    rollupOptions: {
        onwarn(warning, defaultHandler) {
            if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) return;

            if (userConfig.build?.rollupOptions?.onwarn) {
                userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
            } else {
                defaultHandler(warning);
            }
        },
    },
});

export default function react({ jsxImportSource = "react", tsDecorators, plugins, devTarget = "es2020" } = {}) {
    let hmrDisabled = false;
    plugins = plugins ? plugins.map(el => [resolve(el[0]), el[1]]) : undefined

    return [
        {
            name: "vite:react:resolve-runtime",
            apply: "serve",
            enforce: "pre", // Run before Vite default resolve to avoid syscalls
            resolveId: (id) => (id === runtimePublicPath ? id : undefined),
            load: (id) => id === runtimePublicPath ? readFileSync(join(globalThis.__dirname, "vite.config.hmr.js"), "utf-8") : undefined
        },
        {
            name: "vite:react",
            apply: "serve",
            config: () => ({
                esbuild: false,
                optimizeDeps: {
                    include: [`${jsxImportSource}/jsx-dev-runtime`],
                    esbuildOptions: { jsx: "automatic" },
                }
            }),
            configResolved(config) {
                if (config.server.hmr === false) hmrDisabled = true;
                const mdxIndex = config.plugins.findIndex((p) => p.name === "@mdx-js/rollup");
                if (mdxIndex !== -1 && mdxIndex > config.plugins.findIndex((p) => p.name === "vite:react"))
                    throw new Error("[vite:react] The MDX plugin should be placed before this plugin");
                if (globalThis.process?.versions?.webcontainer)
                    config.logger.warn("[vite:react] The compiler currently not supported in WebContainers.",);
            },
            transformIndexHtml: (_, config) => [{
                tag: "script",
                attrs: { type: "module" },
                children: preambleCode.replace("__PATH__", config.server.config.base + runtimePublicPath.slice(1))
            }],
            async transform(code, id, transformOptions) {
                const [filepath] = id.split("?")
                const refresh = !transformOptions?.ssr && !hmrDisabled;

                const result = await transformWithOptions(filepath, code, devTarget, { tsDecorators, plugins }, {
                    refresh,
                    development: true,
                    runtime: "automatic",
                    importSource: jsxImportSource
                });
                if (!result) return;

                if (!refresh || !refreshContentRegExp.test(result.code))
                    return result;

                result.code = `import * as RefreshRuntime from "${runtimePublicPath}";

if (!window.$RefreshReg$) throw new Error("React refresh preamble was not loaded. Something is wrong.");
const prevRefreshReg = window.$RefreshReg$;
const prevRefreshSig = window.$RefreshSig$;
window.$RefreshReg$ = RefreshRuntime.getRefreshReg("${filepath}");
window.$RefreshSig$ = RefreshRuntime.createSignatureFunctionForTransform;

${result.code}

window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
  RefreshRuntime.registerExportsForReactRefresh("${filepath}", currentExports);
  import.meta.hot.accept((nextExports) => {
    if (!nextExports) return;
    const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports);
    if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
  });
});
`;

                const sourceMap = JSON.parse(result.map);
                sourceMap.mappings = ";;;;;;;;" + sourceMap.mappings;
                return { code: result.code, map: sourceMap };
            },
        },
        plugins
            ? {
                name: "vite:react",
                apply: "build",
                enforce: "pre", // Run before esbuild
                config: (userConfig) => ({
                    build: silenceUseClientWarning(userConfig),
                }),
                transform: (code, id) => transformWithOptions(id.split("?")[0], code, "esnext", { tsDecorators, plugins }, {
                    runtime: "automatic",
                    importSource: jsxImportSource,
                })
            }
            : {
                name: "vite:react",
                apply: "build",
                config: (userConfig) => ({
                    build: silenceUseClientWarning(userConfig),
                    esbuild: {
                        jsx: "automatic",
                        jsxImportSource: jsxImportSource,
                        tsconfigRaw: {
                            compilerOptions: { useDefineForClassFields: true },
                        }
                    }
                })
            }
    ]
};