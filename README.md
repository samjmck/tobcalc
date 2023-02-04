# [tobcalc](https://tobcalc.com)

https://user-images.githubusercontent.com/25828757/161982707-3b84b8e1-cae3-4ec0-b348-f6d64d7d5c30.mp4

tobcalc is a project that calculates the Belgian transaction tax on securities for various brokers and fills in the PDF form associated with these taxes.

## Why does this project exist?

Belgian brokers pay the transaction tax, also known as the TOB, automatically for you. However, if you use a foreign broker, such as Interactive Brokers or tastyworks, you will have to calculate, pay and file this tax manually for every transaction you made in the period of 2 months. This process can be time-consuming and frustrating, which is why many Belgian investors decide not to use foreign brokers despite them possibly fitting their needs better than domestic brokers. 

The goal of this project is to simplify the process of calculating and filing the TOB. By doing so, one of the barriers for choosing foreign brokers is partially removed and investors may have more brokers to choose from.

## Which brokers are currently supported?

Currently, the following brokers are supported:
- Interactive Brokers (last checked: 28 March 2022) [(guide)](docs/brokers/interactive-brokers-guide.md)

## How does it work?

Nearly all brokers allow you to export your transactions as a CSV or Excel file. That file will then be read by tobcalc and converted into a simplified format which only includes the data needed to calculate the tax on the transactions. If necessary, the data relating to a transaction's security will be fetched from an investing site so the parameters needed to accurately calculate the tax rate can be determined. If the transaction was made in a foreign currency, the exchange rate for that day will be fetched from the European Central Bank.

Once the data is complete with the parameters needed to calculate the tax rates and has been converted into the right format, the actual taxes will be calculated and the PDF form will be filled in. 


## Is it secure?

The transactions file gets processed locally. For transactions in a foreign currency, the exchange rate on the date of the transaction will be fetched from the European Central Bank. This means that the date of the transaction and the currency will be sent to their server. For securities such as ETFs, it's required to know whether the fund is accumulating or distributing to be able to calculate the correct tax rate. For this, the ISIN of the security will be sent to Investing.com's server.

[Read more details on tobcalc's security details and design here.](docs/design.md)

## Known issues and bugs

- CORS proxy cookies giving warnings in some browsers
- PDF viewer in Firefox glitches out sometimes
- PDF viewer in Safari does not refresh

## To do (order of high to low priority)

- [ ] Look at OpenFIGI for more reliable ISIN numbers
- [x] Create development branch with subdomain for development deployments
- [ ] Only deploy code to site if all Deno tests succeed
- [ ] Add tests for scripts such as `fetch_registered_funds.ts`, better errors
- [ ] Test proxies periodically
- [ ] Fix site caching
- [ ] Explain in docs how floating point errors and rounding errors are handled
- [x] Check if fund is registered in Belgium
- [x] Use Web Worker to run CPU intensive code such as PDF generation on a different thread to keep UI smooth
- [x] Write tests
- [x] Add error handling in important and critical parts of code
- [x] Fix PDF forms
- [x] Add checks for errors/throws in tests
- [x] Change layout of web page so services are new column next to input boxes
- [x] Finish `README.md`
- [x] Write documentation on how contributors can help with adding brokers
- [x] Add basic tests within browser to check if security data is correct for popular funds
- [ ] Reduce browser bundle size
  - [ ] Use more advanced package bundler such as webpack instead of `deno bundle`
- [ ] Improve bundling and site generation workflow
- [ ] Figure out how to do automatic type exports
- [ ] Add tastyworks
- [x] Add Trading 212
- [ ] See if SvelteKit can be used for improved loading times and SEO
