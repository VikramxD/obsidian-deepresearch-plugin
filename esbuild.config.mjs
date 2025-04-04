import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner =
`/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/
`;

const prod = process.argv[2] === "production";

// Skip TypeScript errors in node_modules
const onResolvePlugin = {
  name: 'skip-node-types',
  setup(build) {
    // Skip type errors from node types
    build.onResolve({ filter: /node_modules\/@types\/node/ }, args => ({ path: args.path, external: true }));
  },
};

esbuild.build({
  banner: {
    js: banner,
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    ...builtins,
  ],
  format: "cjs",
  watch: !prod,
  target: "es2016",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins: [onResolvePlugin],
}).catch(() => process.exit(1)); 