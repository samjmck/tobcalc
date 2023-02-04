import { CountryCode, CurrencyCode, eeaCountries, Security, SecurityType } from "./enums.ts";
import {
    formatDate,
    getExchangeRatesMap
} from "./data.ts";
import { BrokerTransaction } from "./broker_adapter.ts";
import { InformativeError } from "./InformativeError.ts";
import { lowerCaseRegisteredFunds } from "./registered_funds.ts";

// Case-insensitive
export function isNameRegistered(name: string) {
    return lowerCaseRegisteredFunds.includes(name.toLowerCase());
}

export type GetSecuritiesMapFunction = (isins: string[]) => Promise<Map<string, Security>>;

export async function getTaxableTransactions(brokerTransactions: BrokerTransaction[], getSecuritiesMap: GetSecuritiesMapFunction): Promise<TaxableTransaction[]> {
    const currencyCodeEarliestDate: Map<CurrencyCode, Date> = new Map();
    const currencyCodeLatestDate: Map<CurrencyCode, Date> = new Map();
    const isins = new Set<string>();
    for (const brokerTransaction of brokerTransactions) {
        if (brokerTransaction.currency !== CurrencyCode.EUR) {
            const earliestDateForCurrency = currencyCodeEarliestDate.get(brokerTransaction.currency);
            if (earliestDateForCurrency === undefined || brokerTransaction.date.valueOf() < earliestDateForCurrency.valueOf()) {
                currencyCodeEarliestDate.set(brokerTransaction.currency, brokerTransaction.date);
            }
            const latestDateForCurrency = currencyCodeLatestDate.get(brokerTransaction.currency);
            if (latestDateForCurrency === undefined || brokerTransaction.date.valueOf() > latestDateForCurrency.valueOf()) {
                const latestDate = new Date(brokerTransaction.date);
                latestDate.setDate(latestDate.getDate() + 1);
                currencyCodeLatestDate.set(brokerTransaction.currency, latestDate);
            }
        }
        isins.add(brokerTransaction.isin);
    }

    const currencyPeriods: { start: Date, end: Date, currencyCode: CurrencyCode }[] = [];
    for (const currencyCode of currencyCodeEarliestDate.keys()) {
        currencyPeriods.push({
            start: <Date> currencyCodeEarliestDate.get(currencyCode),
            end: <Date> currencyCodeLatestDate.get(currencyCode),
            currencyCode,
        });
    }

    const [
        securitiesByIsin,
        exchangeRatesMap,
    ] = await Promise.all([
        getSecuritiesMap([...isins]),
        getExchangeRatesMap(currencyPeriods),
    ]);

    const exchangeRates = exchangeRatesMap;

    const taxableTransactions: TaxableTransaction[] = [];
    for (const brokerTransaction of brokerTransactions) {
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
            // Cached exchange rate is EUR -> TransactionCurrency
            // We are going from TransactionCurrency -> EUR, so inverted
            value = value * (1/exchangeRate);
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

type TaxRateFunction = (taxableTransaction: TaxableTransaction) => number;

export const getDefaultTaxRate: TaxRateFunction = (taxableTransaction: TaxableTransaction) => {
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
            if (taxableTransaction.countryCode === CountryCode.Belgium || isNameRegistered(taxableTransaction.security.name)) {
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

export function getTaxFormData(taxableTransactions: TaxableTransaction[], getTaxRate: TaxRateFunction): TaxFormData {
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
