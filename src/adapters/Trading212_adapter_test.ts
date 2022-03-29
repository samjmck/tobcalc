import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";
import { Trading212Adapter } from "./Trading212_adapter.ts";

Deno.test({
    name: "Trading212 adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Trading212_adapter_test.csv");
        const brokerTransactions = await Trading212Adapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date("2021-04-01"),
            isin: "IE00BK5BQT80",
            currency: CurrencyCode.EUR,
            value: 1172_64,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date("2021-05-03"),
            isin: "US78462F1030",
            currency: CurrencyCode.USD,
            value: 1083_96,
        });
        assertEquals(brokerTransactions[2], <BrokerTransaction> {
            date: new Date("2021-07-13"),
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 301_22,
        });
        assertEquals(brokerTransactions[3], <BrokerTransaction> {
            date: new Date("2021-07-13"),
            isin: "IE00B0M63177",
            currency: CurrencyCode.EUR,
            value: 483_74,
        });
        assertEquals(brokerTransactions[4], <BrokerTransaction> {
            date: new Date("2021-08-16"),
            isin: "US4781601046",
            currency: CurrencyCode.USD,
            value: 301_55,
        });
        assertEquals(brokerTransactions[5], <BrokerTransaction> {
            date: new Date("2021-09-02"),
            isin: "BE0003717312",
            currency: CurrencyCode.EUR,
            value: 205_31,
        });
    },
});
