import { IBKRAdapter } from "./IBKR_adapter.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";

Deno.test({
    name: "IBKR adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/IBKR_adapter_test.csv");
        const brokerTransactions = await IBKRAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 357_36,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 357_36,
        });
        assertEquals(brokerTransactions[2], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BK5BQT80",
            currency: CurrencyCode.EUR,
            value: 791_75,
        });
        assertEquals(brokerTransactions[3], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 1305_57,
        });
        assertEquals(brokerTransactions[4], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "US0378331005",
            currency: CurrencyCode.USD,
            value: 1381_75,
        });
        assertEquals(brokerTransactions[5], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 303_11,
        });
        assertEquals(brokerTransactions[6], <BrokerTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 303_10,
        })
        assertEquals(brokerTransactions.length, 7);
    },
});
