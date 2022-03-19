# tobcalc

tobcalc is a project that calculates the Belgian transaction tax on securities for various brokers and fills in the PDF form associated with these taxes.

## Why does this project exist?

Belgian brokers pay the transaction tax, also known as the TOB, automatically for you. However, if you use a foreign broker, such as Interactive Brokers or tastyworks, you will have to calculate, pay and file this tax manually for every transaction you made in the period of 2 months. This process can be time-consuming and frustrating, which is why many Belgian investors decide not to use foreign brokers despite them possibly fitting their needs better than domestic brokers. 

The goal of this project is to simplify the process of calculating and filing the TOB. By doing so, one of the barriers for choosing foreign brokers is partially removed and investors may have more brokers to choose from.

## Which brokers are currently supported?

Currently, the following brokers are supported:
- Interactive Brokers (last updated: 4 March 2022)

## How does it work?

Nearly all brokers allow you to export your transactions as a CSV or Excel file. That file will then be read by tobcalc and converted into a simplified format which only includes the data needed to calculate the tax on the transactions. If necessary, the data relating to a transaction's security will be fetched from an investing site so the parameters needed to accurately calculate the tax rate can be determined. If the transaction was made in a foreign currency, the exchange rate for that day will be fetched from the European Central Bank.

Once the data is complete with the parameters needed to calculate the tax rates and has been converted into the right format, the actual taxes will be calculated and the PDF form will be filled in. 

## Is it secure?

The transactions file gets processed locally. For transactions in a foreign currency, the exchange rate on the date of the transaction will be fetched from the European Central Bank. This means that the date of the transaction and the currency will be sent to their server. For securities such as ETFs, it's required to know whether the fund is accumulating or distributing to be able to calculate the correct tax rate. For this, the ISIN of the security will be sent to Investing.com's server.

## Technical explanations

### Design

tobcalc's code was written to be used with Deno. The reason Deno is being used instead of Node.js is primarily because of [Deno's implementation of web API's](https://deno.land/manual@v1.8.3/runtime/web_platform_apis) which means that the codebase is relatively easy to port if the target platform is the web instead of Deno. In fact, because of [Deno's `bundle` command](https://deno.land/manual/tools/bundler), no porting is necessary as a single ES module is outputted which can be natively used within a browser. Other reasons why Deno was chosen instead of Node.js were Deno's more secure defaults and the fact that no Node modules were needed to make this project possible.

### Hosting

tobcalc is currently hosted by Netlify. The reason for this is that they allow reverse proxies to external APIs, such as the European Central Bank and Investing.com. Without a reverse proxy, a client on tobcalc.com would not be able to contact these APIs directly due to Cross Origin Resource Sharing policies. Cloudflare Pages was another static site hosting option but unfortunately, it seemed like their servers had been blacklisted from making requests to Investing.com. Deno Deploy was also an option but their Terms & Conditions do not allow proxies.

### Possible attack vectors and measures taken to safeguard

- Web app
  - Third party analytics script (SimpleAnalytics/Plausible) will be loaded from webpage
    - We cannot trust any third party - their CDN or script may be compromised
    - Content Security Policy (CSP) will not help in this case
    - Prevent that the code in the script gets changed into something malicious by using Subresource Integrity which checks that the loaded script matches the hash given in the web page
    - This does mean that we have to trust that the version at the time of the hash is safe
  - XSS (e.g. due to unsanitized input being embedded into page)
    - `Content-Security-Policy: default-src 'self'` to prevent inline scripts and only allow requests to own origin (note: this will include the analytics page)


## To do (order of high to low priority)

- [x] Use Web Worker to run CPU intensive code such as PDF generation on a different thread to keep UI smooth
- [x] Write tests
- [x] Add error handling in important and critical parts of code
- [x] Fix PDF forms
- [x] Add checks for errors/throws in tests
- [x] Change layout of web page so services are new column next to input boxes
- [ ] Finish `README.md`
- [x] Write documentation on how contributors can help with adding brokers
- [x] Add basic tests within browser to check if security data is correct for popular funds
- [ ] Reduce browser bundle size
  - [ ] Use more advanced package bundler such as webpack instead of `deno bundle`
- [ ] Improve bundling and site generation workflow
- [ ] Figure out how to do automatic type exports
- [ ] Add tastyworks
- [ ] Add Trading 212
- [ ] See if SvelteKit can be used for improved loading times and SEO
