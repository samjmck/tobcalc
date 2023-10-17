# [tobcalc](https://tobcalc.com)

https://user-images.githubusercontent.com/25828757/161982707-3b84b8e1-cae3-4ec0-b348-f6d64d7d5c30.mp4

tobcalc is a project that calculates the Belgian transaction tax on securities for various brokers and fills in the PDF form associated with these taxes.

> Note: while tobcalc is still fully functional, I haven't had time to fix some bugs and to add new features. If you would like to contribute, please do so. [There's a list](#to-do-list) of issues that need to be fixed and features that would be nice to have.

## Navigation

### FAQ

1. [Why does this project exist?](#why-does-this-project-exist)
2. [Which brokers are currently supported?](#which-brokers-are-currently-supported)
3. [How does it work?](#how-does-it-work)
4. [Is it secure?](#is-it-secure)
5. [To-do list](#to-do-list)

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

The goal of this project is to simplify the process of calculating and filing the TOB. By doing so, the threshold is lowered for Belgian investors that would like to invest using their broker of choice.

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

## To-do list

### Bugs

1. [Issue #11](https://github.com/samjmck/tobcalc/issues/11): the calculated tax rates can go above the ceilings set by the Belgian government. The ceiling was never implemented in tobcalc as at the start of the project, it was clear that it wouldn't be reached by most users. However, to ensure correctness, this should be implemented.
2. [Issue #11](https://github.com/samjmck/tobcalc/issues/11): on Interactive Brokers, trades that are filled in partial fills are considered separate trades. It should be possible to merge these trades into one to not only ensure the correct quantity is used for the tax calculation, but it also has an effect on the ceiling of the tax rate.

### Features and other items

1. It should be possible to merge trades into one. This could be implemented in a similar way to how the [filter broker transactions](site/src/components/PromptFilterBrokerTransactions.svelte) or [failed security fetches](site/src/components/PromptFailedSecurityFetches.svelte) prompts work.
2. A clean-up of the codebase is needed. Some of the code, especially regarding the way prompts work and how default values are handled, is a bit hacky. I would like to find a more robust way to handle this. Some of the proxies are also unused and can be removed.
3. Local development should be simplified with a proxy built in to the dev server and not with a separate proxy server such as Caddy.