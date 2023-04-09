import { SecurityType, CurrencyCode, Security } from "./enums.ts";
import { InformativeError } from "./InformativeError.ts";

// Why do we need these variables and not make them constants?
// Browsers will not be able to make requests to these origins
// due to CORS, so the way to make this script work in a
// web app is to change these variables to proxies for the
// original hostnames
let ECB_HOSTNAME = "sdw-wsrest.ecb.europa.eu";
let YAHOO_FINANCE_QUERY1_HOSTNAME = "query1.finance.yahoo.com";
let JUSTETF_HOSTNAME = "justetf.com";

export function setECBHostname(hostname: string) {
    ECB_HOSTNAME = hostname;
}

export function setYahooFinanceQuery1Hostname(hostname: string) {
    YAHOO_FINANCE_QUERY1_HOSTNAME = hostname;
}

export function setJustETFHostname(hostname: string) {
    JUSTETF_HOSTNAME = hostname;
}

interface ECBTimePeriod {
    id: string;
    name: string;
    start: string;
    end: string;
}

export function formatDate(date: Date): string {
    const addZero = (num: number): string => {
        return num < 10 ? `0${num}` : `${num}`;
    };
    return `${date.getFullYear()}-${addZero(date.getMonth() + 1)}-${addZero(date.getDate())}`;
}

// A two-dimensional `Map` where each key in the first dimension is a currency code
// and each key in the second dimension being a date formatted in YYYY-MM-DD and finally,
// the value of each entry in the second dimension being the exchange rate
export type ExchangeRatesMap = Map<CurrencyCode, Map<string, number>>;
export const exchangeRatesMap: ExchangeRatesMap = new Map();

export async function getExchangeRatesMap(currencyPeriods: { start: Date, end: Date, currencyCode: CurrencyCode }[]): Promise<ExchangeRatesMap> {
    const promises: Promise<void>[] = [];
    for(const { start, end, currencyCode } of currencyPeriods) {
        promises.push(getCurrencyExchangeRatesMap(start, end, currencyCode).then(currencyMap => {
            const existingCurrencyMap = exchangeRatesMap.get(currencyCode);
            if(existingCurrencyMap) {
                for(const [date, exchangeRate] of currencyMap) {
                    existingCurrencyMap.set(date, exchangeRate);
                }
            } else {
                exchangeRatesMap.set(currencyCode, currencyMap);
            }
        }));
    }
    await Promise.all(promises);
    return exchangeRatesMap;
}

// Caches data in exchangesRatesMap
export async function getCurrencyExchangeRatesMap(start: Date, end: Date, currencyCode: CurrencyCode): Promise<Map<string, number>> {
    // See https://sdw-wsrest.ecb.europa.eu/help/

    const startPeriod = formatDate(start);
    const endPeriod = formatDate(end);
    const params = {
        startPeriod,
        endPeriod,
        format: "jsondata",
        detail: "dataonly",
        dimensionAtObservation: "AllDimensions",
    };
    const urlParamsString = new URLSearchParams(params).toString();

    let requestCurrencyCode: CurrencyCode = currencyCode;
    if(currencyCode === CurrencyCode.GBX) {
        requestCurrencyCode = CurrencyCode.GBP;
    }

    const response = await fetch(`https://${ECB_HOSTNAME}/service/data/EXR/D.${requestCurrencyCode}.EUR.SP00.A?${urlParamsString}`);
    if(response.status !== 200) {
        throw new Error(`response from ECB RESTful API returned status code ${response.status}`);
    }
    const json = await response.json();

    let foundTimePeriods = false;
    let timePeriods: ECBTimePeriod[] = [];
    for(const observation of json.structure.dimensions.observation) {
        if(observation.id === "TIME_PERIOD") {
            timePeriods = observation.values;
            foundTimePeriods = true;
            break;
        }
    }
    if(!foundTimePeriods) {
        throw new Error(`could not find time periods for start date ${startPeriod}, end date ${endPeriod} and currencyCodes ${currencyCode}`);
    }

    const currencyMap: Map<string, number> = new Map();
    for(let i = 0; i < timePeriods.length; i++) {
        const date = timePeriods[i].name;
        let exchangeRate = <number> json.dataSets[0].observations[`0:0:0:0:0:${i}`][0];

        if(currencyCode === CurrencyCode.GBX) {
            exchangeRate = exchangeRate * 100;
        }

        currencyMap.set(date, exchangeRate);
    }
    return currencyMap;
}

const securitiesMap: Map<string, Security> = new Map();
// Returns a map of ISINs to securities
// Note that the map at least contains the securities with the given ISINs in the argument
// but it could also include other securities
export async function getDefaultSecuritiesMap(isins: string[]): Promise<Map<string, Security>> {
    const promises: Promise<void>[] = [];
    for(const isin of isins) {
        if(!securitiesMap.has(isin)) {
            promises.push(getSecurity(isin).then(security => {
                securitiesMap.set(isin, security);
            }));
        }
    }
    await Promise.all(promises);
    return securitiesMap;
}

export async function getSecurity(isin: string): Promise<Security> {
    const response = await fetch(`https://${YAHOO_FINANCE_QUERY1_HOSTNAME}/v1/finance/search?q=${isin}&quotesCount=1&newsCount=0`);

    if(response.status !== 200) {
        throw new InformativeError("security.fetch.response_code", { status: response.status, isin });
    }

    const json = await response.json();
    if(json.quotes === undefined) {
        throw new InformativeError("security.fetch.response_format", { isin, json });
    }
    if(json.quotes.length !== 1) {
        throw new InformativeError("security.fetch.not_found", { isin, json });
    }

    const { quoteType, symbol } = json.quotes[0];
    const name = json.quotes[0].longname !== undefined ? json.quotes[0].longname : json.quotes[0].shortname;

    if(name === undefined) {
        throw new InformativeError("security.fetch.name_not_found", { isin, json });
    }

    switch(quoteType) {
        case "MUTUALFUND":
        case "ETF":
            const response = await fetch(`https://${JUSTETF_HOSTNAME}/uk/etf-profile.html?isin=${isin}`, {
                "method": "GET",
            });
            const html = await response.text();
            const accumulating = /<td class="val">Accumulating<\/td>/g.test(html);
            return {
                type: SecurityType.ETF,
                name,
                accumulating,
                isin,
            };
        case "EQUITY":
            return {
                type: SecurityType.Stock,
                name,
                isin,
            };
        default:
            throw new InformativeError("security.fetch.unknown_quote_type", { isin, json });
    }
}
