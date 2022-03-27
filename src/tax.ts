import { CountryCode, CurrencyCode, eeaCountries, Security, SecurityType } from "./enums.ts";
import { cacheExchangeRates, exchangeRatesMap, formatDate, getSecurity } from "./data.ts";
import { ServiceTransaction } from "./service_adapter.ts";
import { InformativeError } from "./InformativeError.ts";
import { lowerCaseRegisteredFunds } from "./registered_funds.ts";

// Case-insensitive
export function isRegistered(name: string) {
    return lowerCaseRegisteredFunds.includes(name.toLowerCase());
}

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
                throw new InformativeError("exchange_rates.undefined", brokerTransaction);
            }
            const exchangeRate = currencyExchangeRates.get(formatDate(brokerTransaction.date));
            if (exchangeRate === undefined) {
                throw new InformativeError("exchange_rates.undefined_at_date", brokerTransaction);
            }
            value = value * exchangeRate;
        }
        const countryCodeMatches = brokerTransaction.isin.match(/[A-Z][A-Z]/g);
        if (countryCodeMatches === null) {
            throw new InformativeError("isin.no_match", brokerTransaction);
        }
        const security = securitiesByIsin.get(brokerTransaction.isin);
        if (security === undefined) {
            throw new InformativeError("security.no_data", brokerTransaction);
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
            // TODO: this is not right - we need to check if fund is registered in Belgium
            // The FSMA list registered funds by NAME, not ISIN
            // This makes determining whether a fund is registered or not quite difficult to do programmatically
            // because different services and APIs can list funds with the same ISIN under slightly different names
            // e.g "Vanguard FTSE All-World EUR" (Trading212)
            // vs  "Vanguard FTSE All-World UCITS ETF USD Accumulation" (Investing.com & Yahoo Finance)
            // vs  "Vanguard FTSE All-World UCITS ETF USD Acc" (Google Finance)
            // So in practice, a security's name does NOT uniquely determine a security (or ISIN)
            // an ISIN of course would
            // (Please FSMA start using ISINs)
            if (taxableTransaction.countryCode === CountryCode.Belgium || isRegistered(taxableTransaction.security.name)) {
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
            throw new InformativeError("tax_rate.not_found", taxableTransaction);
    }
}

export interface FormRow {
    quantity: number;
    taxBase: number;
    taxValue: number;
}

export type TaxFormData = Map<number, FormRow>;

export function getTaxFormData(taxableTransactions: TaxableTransaction[]): TaxFormData {
    const map: Map<number, FormRow> = new Map();
    for(const taxableTransaction of taxableTransactions) {
        const taxRate = getTaxRate(taxableTransaction);
        let formRow = map.get(taxRate);
        if(formRow === undefined) {
            formRow = {
                quantity: 0,
                taxBase: 0,
                taxValue: 0,
            };
            map.set(taxRate, formRow);
        }
        formRow.quantity += 1;
        formRow.taxBase += taxableTransaction.value;
    }
    // Calculate taxValue at the end so we only suffer from one floating point error and aren't constantly adding them together
    for(const [taxRate, formRow] of map.entries()) {
        formRow.taxValue = formRow.taxBase * taxRate;
    }
    return map;
}
