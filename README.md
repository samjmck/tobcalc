# [tobcalc](https://tobcalc.com)

https://user-images.githubusercontent.com/25828757/161982707-3b84b8e1-cae3-4ec0-b348-f6d64d7d5c30.mp4

tobcalc is a project that calculates the Belgian transaction tax on securities for various brokers and fills in the PDF form associated with these taxes.

## Navigation

### FAQ

1. [Why does this project exist?](#why-does-this-project-exist)
2. [Which brokers are currently supported?](#which-brokers-are-currently-supported)
3. [How does it work?](#how-does-it-work)
4. [Is it secure?](#is-it-secure)

### Using tobcalc with different brokers

- [Interactive Brokers](docs/brokers/interactive-brokers-guide.md)
- [DEGIRO](docs/brokers/degiro-guide.md)
- [Boursorama](docs/brokers/boursorama-guide.md)

#### Development

- [Project design](docs/design.md)
- [Local development](docs/local-development.md)
- [How to add support for a broker](docs/add-broker.md)

## Why does this project exist?

Belgian brokers pay the transaction tax, also known as the TOB, automatically for you. However, if you use a foreign broker, such as Interactive Brokers or tastyworks, you will have to calculate, pay and file this tax manually for every transaction you made in the period of 2 months. This process can be time-consuming and frustrating, which is why many Belgian investors decide not to use foreign brokers despite them possibly fitting their needs better than domestic brokers. 

The goal of this project is to simplify the process of calculating and filing the TOB. By doing so, one of the barriers for choosing foreign brokers is partially removed and investors may have more brokers to choose from.

## Which brokers are currently supported?

Currently, the following brokers are supported:
- Interactive Brokers (last checked: 28 March 2022) [(guide)](docs/brokers/interactive-brokers-guide.md)
- Trading212 (last checked: 29 March 2022) (no guide yet)
- DEGIRO (last checked: 2 April 2023) [(guide)](docs/brokers/degiro-guide.md)
- Boursorama (last checked: 3 April 2023) [(guide)](docs/brokers/boursorama-guide.md)

## How does it work?

Nearly all brokers allow you to export your transactions as a CSV or Excel file. That file will then be read by tobcalc and converted into a simplified format which only includes the data needed to calculate the tax on the transactions. If necessary, the data relating to a transaction's security will be fetched from an investing site so the parameters needed to accurately calculate the tax rate can be determined. If the transaction was made in a foreign currency, the exchange rate for that day will be fetched from the European Central Bank.

Once the data is complete with the parameters needed to calculate the tax rates and has been converted into the right format, the actual taxes will be calculated and the PDF form will be filled in. 


## Is it secure?

The transactions file gets processed locally. For transactions in a foreign currency, the exchange rate on the date of the transaction will be fetched from the European Central Bank. This means that the date of the transaction and the currency will be sent to their server. For securities such as ETFs, it's required to know whether the fund is accumulating or distributing to be able to calculate the correct tax rate. For this, the ISIN of the security will be sent to Investing.com's server.

[Read more details on tobcalc's security details and design here.](docs/design.md)

## Known issues and bugs

- PDF viewer in Firefox glitches out sometimes
- PDF viewer in Safari does not refresh