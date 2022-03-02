import { CountryCode, CurrencyCode, eeaCountries, Security, SecurityType } from "./enums.ts";
import { cacheExchangeRates, exchangeRatesMap, formatDate, getSecurity } from "./data.ts";
import { ServiceTransaction } from "./service_adapter.ts";

export async function getTaxableTransactions(serviceTransactions: ServiceTransaction[]): Promise<TaxableTransaction[]> {
    const currencyCodeEarliestDate: Map<CurrencyCode, Date> = new Map();
    const currencyCodeLatestDate: Map<CurrencyCode, Date> = new Map();
    const isins = new Set<string>();
    for (const serviceTransaction of serviceTransactions) {
        if (serviceTransaction.currency !== CurrencyCode.EUR) {
            const earliestDateForCurrency = currencyCodeEarliestDate.get(serviceTransaction.currency);
            if (earliestDateForCurrency === undefined || serviceTransaction.date.valueOf() < earliestDateForCurrency.valueOf()) {
                currencyCodeEarliestDate.set(serviceTransaction.currency, serviceTransaction.date);
            }
            const latestDateForCurrency = currencyCodeLatestDate.get(serviceTransaction.currency);
            if (latestDateForCurrency === undefined || serviceTransaction.date.valueOf() > latestDateForCurrency.valueOf()) {
                const latestDate = new Date(serviceTransaction.date);
                latestDate.setDate(latestDate.getDate() + 1);
                currencyCodeLatestDate.set(serviceTransaction.currency, latestDate);
            }
        }
        isins.add(serviceTransaction.isin);
    }

    const exchangeRatePromises: Promise<void>[] = [];
    for (const currencyCode of currencyCodeEarliestDate.keys()) {
        exchangeRatePromises.push(cacheExchangeRates(<Date>currencyCodeEarliestDate.get(currencyCode), <Date>currencyCodeLatestDate.get(currencyCode), currencyCode));
    }

    const securitiesByIsin = new Map<string, Security>();
    const securitiesTypePromises: Promise<void>[] = [];
    for (const isin of isins) {
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
    for (const brokerTransaction of serviceTransactions) {
        let value = brokerTransaction.value;
        if (brokerTransaction.currency !== CurrencyCode.EUR) {
            const currencyExchangeRates = exchangeRates.get(brokerTransaction.currency);
            if (currencyExchangeRates === undefined) {
                throw new Error(`exchange rates for currency ${brokerTransaction.currency} are undefined`);
            }
            const exchangeRate = currencyExchangeRates.get(formatDate(brokerTransaction.date));
            if (exchangeRate === undefined) {
                throw new Error(`exchange rate for currency ${brokerTransaction.currency} at ${formatDate(brokerTransaction.date)} are undefined`);
            }
            value = value * exchangeRate;
        }
        const countryCodeMatches = brokerTransaction.isin.match(/[A-Z][A-Z]/g);
        if (countryCodeMatches === null) {
            throw new Error(`could not find ISIN match in ${brokerTransaction.isin}`);
        }
        const security = securitiesByIsin.get(brokerTransaction.isin);
        if (security === undefined) {
            throw new Error(`security data for ISIN ${brokerTransaction.isin} is undefined`);
        }
        taxableTransactions.push({
            value,
            security,
            countryCode: <CountryCode>countryCodeMatches[0],
        });
    }
    return taxableTransactions;
}

export interface TaxableTransaction {
    value: number; // EUR
    security: Security;
    countryCode: CountryCode;
}

export function getTaxRate(taxableTransaction: TaxableTransaction): number {
    switch (taxableTransaction.security.type) {
        case SecurityType.ETF:
            if (taxableTransaction.countryCode === CountryCode.Belgium) {
                if (taxableTransaction.security.accumulating) {
                    return 0.0132;
                } else {
                    return 0.0012;
                }
            } else if (eeaCountries.indexOf(taxableTransaction.countryCode) > -1) {
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

export type TaxFormData = Map<number, FormRow>;

export function getTaxFormData(taxableTransactions: TaxableTransaction[]): TaxFormData {
    const map: Map<number, FormRow> = new Map();
    for (const taxableTransaction of taxableTransactions) {
        const taxRate = getTaxRate(taxableTransaction);
        let formRow = map.get(taxRate);
        if (formRow === undefined) {
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
