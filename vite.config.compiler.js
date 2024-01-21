import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { cwd, env } from "node:process";
import { fileURLToPath } from "node:url";
import { createFilter, loadEnv } from "vite";
import remapping from "@ampproject/remapping";
import { transform } from "@swc/core";
import MagicString from "magic-string";

const runtimePublicPath = "/@react-refresh";

globalThis.__filename ??= fileURLToPath(import.meta.url);
globalThis.__dirname ??= dirname(globalThis.__filename);

const resolve = createRequire(import.meta.url).resolve;

const comments = [
    { type: "js", start: "// ", end: "", regex: /^\/\/\s?(.*)$/ }, // js
    { type: "jsx", start: "{/* ", end: " */}", regex: /^\{\s?\/\*\s?(.*)\s?\*\/\s?\}$/ }, // jsx
    { type: "css", start: "/* ", end: " */", regex: /^\/\*\s?(.*)\*\/$/ }, // css
    { type: "html", start: "<!-- ", end: " -->", regex: /^<!--\s?(.*)-->$/ }  // html
];

export function react({ jsxImportSource = "react", tsDecorators, plugins, devTarget = "es2020" } = {}) {
    let hmrDisabled = false;
    plugins = plugins ? plugins.map(el => [resolve(el[0]), el[1]]) : undefined;

    return [
        {
            name: "vite:react:resolve-runtime",
            apply: "serve",
            enforce: "pre", // Run before Vite default resolve to avoid syscalls
            resolveId: (id) => (id === runtimePublicPath ? id : undefined),
            load: (id) => (id === runtimePublicPath
                ? readFileSync(join(globalThis.__dirname, "vite.config.hmr.js"), "utf-8")
                : undefined)
        },
        {
            name: "vite:react",
            apply: "serve",
            config: () => ({
                esbuild: false,
                optimizeDeps: {
                    include: [`${jsxImportSource}/jsx-dev-runtime`],
                    esbuildOptions: { jsx: "automatic" }
                }
            }),
            configResolved(config) {
                if (config.server.hmr === false) hmrDisabled = true;
                if (globalThis.process?.versions?.webcontainer)
                    config.logger.warn("[vite:react] The compiler currently not supported in WebContainers.");
            },
            transformIndexHtml: (html, config) => [{
                tag: "script",
                attrs: { type: "module" },
                children: `
import { injectIntoGlobalHook } from "__PATH__";
injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;`
                        .replace("__PATH__", config.server.config.base + runtimePublicPath.slice(1))
            }],
            async transform(code, id, transformOptions) {
                const [filepath] = id.split("?");
                const refresh = !transformOptions?.ssr && !hmrDisabled;

                const result = await transformWithOptions(filepath, code, devTarget, {
                    tsDecorators,
                    plugins
                }, {
                    refresh,
                    development: true,
                    runtime: "automatic",
                    importSource: jsxImportSource
                });
                if (!result) return;

                if (!refresh || !/\$Refresh(?:Reg|Sig)\$\(/.test(result.code))
                    return result;

                result.code = `
import * as RefreshRuntime from "${runtimePublicPath}";

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
    const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("${filepath}", currentExports, nextExports);
    if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
  });
});`;

                const sourceMap = JSON.parse(result.map);
                sourceMap.mappings = ";;;;;;;;" + sourceMap.mappings;
                return { code: result.code, map: sourceMap };
            }
        },
        plugins
            ? {
                name: "vite:react",
                apply: "build",
                enforce: "pre", // Run before esbuild
                config: (userConfig) => ({ build: silenceUseClientWarning(userConfig) }),
                transform: (code, id) => transformWithOptions(id.split("?")[0], code, "esnext", {
                    tsDecorators,
                    plugins
                }, {
                    runtime: "automatic",
                    importSource: jsxImportSource
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
                            compilerOptions: { useDefineForClassFields: true }
                        }
                    }
                })
            }
    ];

    async function transformWithOptions(id, code, target, options, reactConfig) {
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
                        react: reactConfig
                    }
                }
            });
        } catch (err) {
            const message = err.message;
            const fileStartIndex = message.indexOf("╭─[");
            if (fileStartIndex !== -1) {
                const match = message.slice(fileStartIndex).match(/:(\d+):(\d+)]/);
                if (match) {
                    err.line = match[1];
                    err.column = match[2];
                }
            }
            throw err;
        }

        return result;
    }

    function silenceUseClientWarning(userConfig) {
        return {
            rollupOptions: {
                onwarn(warning, defaultHandler) {
                    if (warning.code === "MODULE_LEVEL_DIRECTIVE" && warning.message.includes("use client")) return;

                    if (userConfig.build?.rollupOptions?.onwarn) {
                        userConfig.build.rollupOptions.onwarn(warning, defaultHandler);
                    } else {
                        defaultHandler(warning);
                    }
                }
            }
        };
    }
}

export function preprocessor({ include = ["**/*"], exclude = [/[\\/]node_modules[\\/]/], directives = [] } = {}) {
    const filter = createFilter(include, exclude);
    const context = { env };

    return [{
        name: "vite:preprocessor-directives",
        enforce: "pre",
        configResolved(config) {
            context.env = {
                ...loadEnv(config.mode ?? env.NODE_ENV ?? "development", cwd(), ""),
                ...config.env
            };
        },
        transform(code, id) {
            if (filter(id)) {
                const orderedDirectives = directives.map(directive => typeof directive === "function" ? directive(context) : directive)
                    .reduce((acc, p) => {
                        const enforceMap = { "pre": 0, "normal": 1, "post": 2 };
                        acc[enforceMap[(p?.enforce) ?? "normal"]].push(p);
                        return acc;
                    }, [[], [], []]).flat();
                const tokens = lex(code, orderedDirectives.map(d => d.lex));
                const ast = parse(tokens, orderedDirectives.map(d => d.parse));
                const transformed = transform(ast, orderedDirectives.map(d => d.transform));
                if (transformed) {
                    const generated = generate(transformed, orderedDirectives.map(d => d.generate));
                    if (generated) {
                        const ms = new MagicString(code, { filename: id });
                        ms.overwrite(0, code.length, generated);
                        const map = remapping([ms.generateMap({ hires: true }), this.getCombinedSourcemap()], () => null);
                        return { code: ms.toString(), map };
                    }
                }
            }
        }
    }];

    function lex(code, lexers = []) {
        const state = { tokens: [], current: 0, code, lexers };

        scanner: while (state.current < code.length) {
            let endIndex = code.indexOf("\n", state.current + 1);
            endIndex = endIndex === -1 ? code.length : endIndex;
            const line = code.slice(state.current, endIndex).trim();

            if (comments.some(comment => comment.regex.test(line))) {
                for (const lexer of lexers) {
                    const comment = comments.find(comment => comment.start === line.slice(0, comment.start.length))
                    const content = comment?.regex.exec(line)?.[1];
                    const token = lexer(state, content?.trim());
                    if (token) {
                        state.tokens.push({ comment: comment?.type , ...token });
                        state.current = endIndex;
                        continue scanner;
                    }
                }
            }
            state.tokens.push({ type: "code", value: line });
            state.current = endIndex;
        }
        return state.tokens;
    }

    function parse(tokens, parsers = []) {
        const state = { ast: { type: "Program", body: [] }, current: 0, tokens, parsers, walk }

        while (state.current < tokens.length)
            state.ast.body.push(walk(state));

        return state.ast;

        function walk(state) {
            const token = state.tokens[state.current];
            if (token.type === "code") {
                state.current++;
                return { type: "CodeStatement", value: token.value };
            }
            for (const parser of state.parsers) {
                const node = parser(state, token);
                if (node) return { comment: token.comment, ...node };
            }
            throw new Error(`Parser: Unknown token type: ${token.type}`);
        }
    }

    function transform(node, transforms = []) {
        return walk({ transforms, walk }, node);

        function walk(state, node) {
            switch (node.type) {
                case "Program":
                    return { ...node, body: node.body.map(node => state.walk(state, node)).filter(Boolean) };
                case "CodeStatement":
                    return node;
                default:
                    for (const transformer of state.transforms) {
                        const transformed = transformer(state, node);
                        if (transformed) return transformed;
                    }
                    throw new Error(`Transformer: Unknown node type: ${node.type}`);
            }
        }
    }

    function generate(node, generates = []) {
        return walk({ generates, walk }, node);

        function walk(state, node) {
            switch (node.type) {
                case "Program":
                    return node.body.map(node => state.walk(state, node)).filter(Boolean).join("\n");
                case "CodeStatement":
                    return node.value;
                default:
                    for (const generator of state.generates) {
                        const comment = comments.find(comment => comment.type === node.comment);
                        const generated = generator(state, node, comment);
                        if (generated) return generated;
                    }
                    throw new Error(`Generator: Unknown node type: ${node.type}`);
            }
        }
    }
}
