import { CountryCode, CurrencyCode, eeaCountries, Security, SecurityType } from "./enums.ts";
import { cacheExchangeRates, exchangeRatesMap, formatDate, getSecurity } from "./data.ts";

// https://eservices.minfin.fgov.be/myminfin-web/pages/fisconet/document/07143c83-8ef9-4d85-a5fd-7564b0393e1b#_Toc513120036

// getBrokerTransactions() -> BrokerTransactions[] -> getExchangeRates(), getSecuritiesTypes() -> TaxableTransaction[] -> getTaxFormData()

interface BrokerTransaction {
    date: Date;
    isin: string;
    currency: CurrencyCode;
    value: number;
}

interface BrokerAdapter {
    (data: Blob): Promise<BrokerTransaction[]>;
}

export async function IBKRAdapter(data: Blob): Promise<BrokerTransaction[]> {
    const text = await data.text();
    const rows = text.split("\n");
    const columnNames = rows[0].split(",");
    const brokerTransactions: BrokerTransaction[] = [];
    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);
    for(const rowString of rows.slice(1, -1)) {
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        const dateString = row[dateColumnIndex];
        brokerTransactions.push({
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            value: Number(row[valueColumnIndex]),
        });
    }
    return brokerTransactions;
}

export async function getTaxableTransactions(brokerTransactions: BrokerTransaction[]): Promise<TaxableTransaction[]> {
    const currencyCodeEarliestDate: Map<CurrencyCode, Date> = new Map();
    const currencyCodeLatestDate: Map<CurrencyCode, Date> = new Map();
    const isins = new Set<string>();
    for(const brokerTransaction of brokerTransactions) {
        if(brokerTransaction.currency !== CurrencyCode.EUR) {
            const earliestDateForCurrency = currencyCodeEarliestDate.get(brokerTransaction.currency);
            if(earliestDateForCurrency === undefined || brokerTransaction.date.valueOf() < earliestDateForCurrency.valueOf()) {
                currencyCodeEarliestDate.set(brokerTransaction.currency, brokerTransaction.date);
            }
            const latestDateForCurrency = currencyCodeLatestDate.get(brokerTransaction.currency);
            if(latestDateForCurrency === undefined || brokerTransaction.date.valueOf() > latestDateForCurrency.valueOf()) {
                const latestDate = new Date(brokerTransaction.date);
                latestDate.setDate(latestDate.getDate() + 1);
                currencyCodeLatestDate.set(brokerTransaction.currency, latestDate);
            }
        }
        isins.add(brokerTransaction.isin);
    }

    const exchangeRatePromises: Promise<void>[] = [];
    for(const currencyCode of currencyCodeEarliestDate.keys()) {
        exchangeRatePromises.push(cacheExchangeRates(<Date> currencyCodeEarliestDate.get(currencyCode), <Date> currencyCodeLatestDate.get(currencyCode), currencyCode));
    }

    const securitiesByIsin = new Map<string, Security>();
    const securitiesTypePromises: Promise<void>[] = [];
    for(const isin of isins) {
        securitiesTypePromises.push(getSecurity(isin).then(security => {
            securitiesByIsin.set(isin, security);
        }));
    }

    await Promise.all([
        await Promise.all(securitiesTypePromises),
        await Promise.all(exchangeRatePromises),
    ]);

    const exchangeRates = exchangeRatesMap;

    const taxableTransactions: TaxableTransaction[] = [];
    for(const brokerTransaction of brokerTransactions) {
        let value = brokerTransaction.value;
        if(brokerTransaction.currency !== CurrencyCode.EUR) {
            const currencyExchangeRates = exchangeRates.get(brokerTransaction.currency);
            if(currencyExchangeRates === undefined) {
                throw new Error(`exchange rates for currency ${brokerTransaction.currency} are undefined`);
            }
            const exchangeRate = currencyExchangeRates.get(formatDate(brokerTransaction.date));
            if(exchangeRate === undefined) {
                throw new Error(`exchange rate for currency ${brokerTransaction.currency} at ${formatDate(brokerTransaction.date)} are undefined`);
            }
            value = value * exchangeRate;
        }
        const countryCodeMatches = brokerTransaction.isin.match(/[A-Z][A-Z]/g);
        if(countryCodeMatches === null) {
            throw new Error(`could not find ISIN match in ${brokerTransaction.isin}`);
        }
        const security = securitiesByIsin.get(brokerTransaction.isin);
        if(security === undefined) {
            throw new Error(`security data for ISIN ${brokerTransaction.isin} is undefined`);
        }
        taxableTransactions.push({
            value,
            security,
            countryCode: <CountryCode> countryCodeMatches[0],
        });
    }
    return taxableTransactions;
}

interface TaxableTransaction {
    value: number; // EUR
    security: Security;
    countryCode: CountryCode;
}

function getTaxRate(taxableTransaction: TaxableTransaction): number {
    switch(taxableTransaction.security.type) {
        case SecurityType.ETF:
            if(taxableTransaction.countryCode === CountryCode.Belgium) {
                if(taxableTransaction.security.accumulating) {
                    return 0.0132;
                } else {
                    return 0.0012;
                }
            } else if(eeaCountries.indexOf(taxableTransaction.countryCode) > -1) {
                return 0.0012;
            } else {
                return 0.0035;
            }
        case SecurityType.Stock:
            return 0.0035;
        default:
            throw new Error(`could not find tax rate for security type ${taxableTransaction.security}`);
    }
}

interface FormRow {
    quantity: number;
    taxableAmount: number;
    taxValue: number;
}

export function getTaxFormData(taxableTransactions: TaxableTransaction[]): Map<number, FormRow> {
    const map: Map<number, FormRow> = new Map();
    for(const taxableTransaction of taxableTransactions) {
        const taxRate = getTaxRate(taxableTransaction);
        let formRow = map.get(taxRate);
        if(formRow === undefined) {
            formRow = {
                quantity: 0,
                taxableAmount: 0,
                taxValue: 0,
            };
            map.set(taxRate, formRow);
        }
        formRow.quantity += 1;
        formRow.taxableAmount += taxableTransaction.value;
        formRow.taxValue = taxableTransaction.value * taxRate;
    }
    return map;
}
