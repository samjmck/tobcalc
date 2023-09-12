# Developing tobcalc locally

## Prerequisites
For developing the website you will need:
- **Deno** to bundle the core tobcalc files into an ES module that can be used in the web app
- **Node** for Svelte, Rollup and other dependencies
- **Caddy** to run a local proxy to be able to make requests to Yahoo Finance without CORS issues

For developing the core tobcalc library you will need:
- Deno

**Note:** this project makes use of `deno bundle` which is a built-in bundler to export the library as one file that can be imported in a browser. While this functionality still works as intended for this project, `deno bundle` has been deprecated as is planned to be removed from Deno in the future. As of now, Deno version `1.36.4` still supports `deno bundle`. If you are using a newer version and `deno bundle` is no longer available, consider downgrading to `1.36.4`.

## Directory structure

- `.github/workflows` contains the GitHub Actions workflows that run on push and pull. These actions also run daily to ensure the data source (Yahoo Finance, Investing.com or a different source) for fetching security names and types is still functioning.
- `build` contains shell scripts that can be used to build the site on static hosting services such as Netlify or Cloudflare Pages.
- `pdfs` contains the template PDFs that are used for the actual TOB report.
- `proxy` contains proxy scripts for different platforms such as Netlify Edge Functions (which uses Deno Deploy), Caddy (for local hosting) or simply Deno (or Deno Deploy)
- `site` contains the Svelte web app
- `src` contains the core tobcalc library
- `scripts` contains a simple Deno script to fetch the latest registered funds from the FSMA and dump it into a TypeScript file, this script gets ran daily

Lastly, there are a few files in the root directory:
- `web_export.ts` re-exports everything in the core library in one file. With `deno bundle` this file can be bundled into an ES module that can be used in the web app.
- `web_worker_pdf.ts` contains the code that runs in the web worker to generate the PDFs. This file is bundled into a separate ES module that can be used in the web app.
- `web_bundle.sh` is the shell script that bundles both the core library and the web worker into separate ES modules that can be used in the web app.

## Development

After making changes to the core library, you can test them in the interface of the web app. You will need to do the following:
1. Run `deno run --allow-net --allow-write scripts/fetch_registered_funds.ts` to generate the `registered_funds.ts` file in the `src` directory. This file contains the latest registered funds from the FSMA.
2. Update `web_export.ts` to re-export the new functions you added to the core library or to reflect any changes you made to the existing functions.
3. Run `./web_bundle.sh`. This will bundle your core into ES modules that will can be used in the web app. See this as an alternative to installing the core library as a dependency with `npm` in the web app. The ES modules will be placed in the `site/public` directory as `tobcalc-lib.js` and `tobcalc-lib-pdf.js` for the worker.
4. Within the `site` directory, run `npm run dev` to start the Vite development server with live reloading. This server will not have a proxy to Yahoo Finance, so you will need to run the Caddy proxy in the background to be able to make requests to Yahoo Finance without CORS issues. Open a new Terminal window and run `caddy run`. Now visit `localhost:8081` to see the web app.