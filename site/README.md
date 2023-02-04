## Notes on using Deno-generated ES module

In the root directory of this repository, running the `web_bundle.sh` script will output two ES modules in the `site/public` directory: `tobcalc-lib.js` and `tobcalc-lib-pdf.js`. These ES modules can be imported in the web app. The `tobcalc-lib.js` module contains the core library, while the `tobcalc-lib-pdf.js` module contains the code that runs in the web worker to generate the PDFs.

We want our package bundler to import these files at runtime as normal ES modules. To do this, we add `'./tobcalc-lib.js', '../tobcalc-lib.js'` to the `external` property in our Rollup config file. Whenever Rollup comes across an import with those paths, it will not bundle the file, but instead leave the import as it is so it can be imported in the browser at runtime. The second import `''../tobcalc-lib.js'` is for files in the `components` library that need to import `tobcalc-lib.js` from a directory higher.

Lastly, the web worker is located at the root of the generated web app, so it can be used by simply calling `new Worker("tobcalc-lib-pdf.js")`.