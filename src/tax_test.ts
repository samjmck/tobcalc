import { BrokerTransaction } from "./broker_adapter.ts";
import { CountryCode, CurrencyCode, SecurityType } from "./enums.ts";
import {
    FormRow,
    getTaxableTransactions,
    getTaxFormData,
    getDefaultTaxRate,
    isNameRegistered,
    TaxableTransaction
} from "./tax.ts";
import { assertEquals, assertObjectMatch } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { getDefaultSecuritiesMap } from "./data.ts";

Deno.test({
    name: "fund registered with FSMA",
    permissions: {
        net: true,
    },
    fn: async () => {
        assertEquals(isNameRegistered("Vanguard FTSE All-World UCITS ETF"), true);
        assertEquals(isNameRegistered("Vanguard FTSE All-World UCITS ETF Acc"), false);
    },
});

Deno.test({
    name: "broker transactions -> taxable transactions with exchange rates and security types",
    permissions: {
        net: true,
    },
    fn: async () => {
        const brokerTransactions: BrokerTransaction[] = [
            {
                date: new Date("21 February 2022 00:00:00 GMT"),
                isin: "IE00B4L5Y983", // IWDA
                currency: CurrencyCode.EUR,
                value: 1000_00,
            },
            {
                date: new Date("25 February 2022 00:00:00 GMT"),
                isin: "US0378331005", // AAPL,
                currency: CurrencyCode.USD,
                value: 100_00, // EURUSD on 25 Feb -> 1.1216
            },
        ];
        const taxableTransactions = await getTaxableTransactions(brokerTransactions, getDefaultSecuritiesMap);

        const taxableTransactionIWDA = taxableTransactions[0];
        // Why assertObjectMatch and not assertEquals?
        // We are not checking for the name of the security as the name
        // can differ slightly depending on the service/API we are using
        // e.g "Vanguard FTSE All-World EUR" (Trading212)
        // vs  "Vanguard FTSE All-World UCITS ETF USD Accumulation" (Investing.com & Yahoo Finance)
        // vs  "Vanguard FTSE All-World UCITS ETF USD Acc" (Google Finance)
        assertObjectMatch(taxableTransactionIWDA, {
            value: 1000_00,
            countryCode: CountryCode.Ireland,
            security: {
                type: SecurityType.ETF,
                accumulating: true,
            },
        });

        const taxableTransactionAAPL = taxableTransactions[1];
        const exchangeRate = 1/1.1216;
        assertObjectMatch(taxableTransactionAAPL, {
            value: 100_00 * exchangeRate,
            countryCode: CountryCode.UnitedStates,
            security: {
                type: SecurityType.Stock,
            },
        });
    },
});

Deno.test({
    name: "tax rates for different combinations of securities and domiciles",
    fn: () => {
        assertEquals(getDefaultTaxRate({ // ETF in EEA, accumulating
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: true,
                isin: "",
            },
            countryCode: CountryCode.Ireland,
        }), 0.0012);

        assertEquals(getDefaultTaxRate({ // ETF in EEA, distributing
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: false,
                isin: "",
            },
            countryCode: CountryCode.Ireland,
        }), 0.0012);

        assertEquals(getDefaultTaxRate({ // ETF not in EEA, accumulating
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: true,
                isin: "",
            },
            countryCode: CountryCode.Switzerland,
        }), 0.0035);

        assertEquals(getDefaultTaxRate({ // ETF not in EEA, distributing
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: false,
                isin: "",
            },
            countryCode: CountryCode.Switzerland,
        }), 0.0035);

        assertEquals(getDefaultTaxRate({ // ETF in Belgium, accumulating
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: true,
                isin: "",
            },
            countryCode: CountryCode.Belgium,
        }), 0.0132);

        assertEquals(getDefaultTaxRate({ // ETF in Belgium, distributing
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.ETF,
                accumulating: false,
                isin: "",
            },
            countryCode: CountryCode.Belgium,
        }), 0.0012);

        assertEquals(getDefaultTaxRate({ // Stock (in US)
            value: 100_00,
            security: {
                name: "",
                type: SecurityType.Stock,
                isin: "",
            },
            countryCode: CountryCode.UnitedStates,
        }), 0.0035);
    },
});

Deno.test({
    name: "tax form data for taxable transactions",
    fn: () => {
        const taxableTransactions: TaxableTransaction[] = [
            { // ETF in EEA, accumulating       0.0012
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: true,
                    isin: "",
                },
                countryCode: CountryCode.Ireland,
            },
            { // ETF in EEA, distributing       0.0012
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: false,
                    isin: "",
                },
                countryCode: CountryCode.Ireland,
            },
            { // ETF not in EEA, accumulating   0.0035
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: true,
                    isin: "",
                },
                countryCode: CountryCode.Switzerland,
            },
            { // ETF not in EEA, distributing   0.0035
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: false,
                    isin: "",
                },
                countryCode: CountryCode.Switzerland,
            },
            { // ETF in Belgium, accumulating   0.0132
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: true,
                    isin: "",
                },
                countryCode: CountryCode.Belgium,
            },
            { // ETF in Belgium, distributing   0.0012
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.ETF,
                    accumulating: false,
                    isin: "",
                },
                countryCode: CountryCode.Belgium,
            },
            { // Stock (in US)  0.0035
                value: 100_00,
                security: {
                    name: "",
                    type: SecurityType.Stock,
                    isin: "",
                },
                countryCode: CountryCode.UnitedStates,
            }
        ];
        const taxFormData = getTaxFormData(taxableTransactions, getDefaultTaxRate);
        assertEquals(taxFormData.get(0.0012), <FormRow> {
            quantity: 3,
            taxBase: 300_00,
            taxValue: 0.0012 * 300_00,
        });
        assertEquals(taxFormData.get(0.0035), <FormRow> {
            quantity: 3,
            taxBase: 300_00,
            taxValue: 0.0035 * 300_00,
        });
        assertEquals(taxFormData.get(0.0132), <FormRow> {
            quantity: 1,
            taxBase: 100_00,
            taxValue: 0.0132 * 100_00,
        });
    },
});
