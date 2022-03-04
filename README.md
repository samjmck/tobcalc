# tobcalc

tobcalc is a project that calculates the Belgian transaction tax on securities for various brokers and fills in the PDF form associated with these taxes.

## Why does this project exist?

Belgian brokers pay the transaction tax, also known as the TOB, automatically for you. However, if you use a foreign broker, such as Interactive Brokers or tastyworks, you will have to calculate, pay and file this tax manually for every transaction you made in the period of 2 months. This process can be time-consuming and frustrating, which is why many Belgian investors decide not to use foreign brokers despite them possibly fitting their needs better. 

The goal of this project is to simplify the process of calculating and filing the TOB. By doing so, one of the barriers for choosing foreign brokers is partially removed and investors may have more brokers to choose from.

## Which brokers are currently supported?

Currently, the following brokers are supported:
- Interactive Brokers (last updated: 4 March 2022)

## How does it work?

Nearly all brokers allow you to export your transactions as a CSV or Excel file. That file will then be read by tobcalc converted into a simplified format which only includes the data needed to calculate the tax on the transactions. If necessary, the security's data will be fetched from an investing site so the parameters needed to accurately calculate the tax rate can be determined. And if the transaction was made in a foreign currency, the exchange rate for that day will be fetched from the European Central Bank.

Once the data is complete with the parameters needed to calculate the tax rates and has been converted into the right format, the actual taxes will be calculated and the PDF form will be filled in. 

## Is it secure?



## Technical explanations

### Design



### Possible attack vectors and measures taken to safeguard


## To do (order of high to low priority)

- [ ] Use Web Worker to run CPU intensive code such as PDF generation on a different thread to keep UI smooth
- [ ] Write tests
- [ ] Add error handling in important and critical parts of code
- [ ] Work out if Deno Deploy can work as a (free) proxy
- [ ] Finish `README.md`
- [ ] Write documentation on how contributors can help with adding brokers
- [ ] Reduce browser bundle size
  - [ ] Use more advanced package bundler such as webpack instead of `deno bundle`
- [ ] Improve bundling and site generation workflow
- [ ] Figure out how to do automatic type exports
- [ ] Add tastyworks
- [ ] Add Trading 212
