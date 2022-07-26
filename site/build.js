import esbuild from "esbuild";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";
import { replace } from "esbuild-plugin-replace";

const localTobcalcLibImport = {
    name: 'example',
    setup(build) {
        build.onResolve({ filter: /\.\/tobcalc-lib\.js$/ }, args => {
            return { path: args.path, external: true }
        })
    },
};

esbuild
    .build({
        entryPoints: ["src/main.ts"],
        mainFields: ["svelte", "browser", "module", "main"],
        bundle: true,
        outfile: "public/app.js",
        format: "esm",
        sourcemap: "linked",
        plugins: [
            localTobcalcLibImport,
            esbuildSvelte({
                preprocess: sveltePreprocess(),
            }),
            replace({
                "process.env.ECB_HOSTNAME": `"${process.env.ECB_HOSTNAME}"`,
                "process.env.INVESTING_COM_HOSTNAME": `"${process.env.INVESTING_COM_HOSTNAME}"`,
            }),
        ],
    })
    .catch(() => process.exit(1));
