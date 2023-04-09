import { BoursoramaAdapter } from "./Boursorama_adapter.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";

Deno.test({
    name: "Boursorama adapter converting csv to taxable transactions test 1",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Boursorama_adapter_test.csv");
        const brokerTransactions = await BoursoramaAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date(2023, 1, 6), // 2023-06-02
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 219_24,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date(2023, 1, 2), // 2023-02-02
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 144_66,
        });
        assertEquals(brokerTransactions.length, 2);
    }
});

Deno.test({
    name: "Boursorama adapter converting csv to taxable transactions test 2",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Boursorama_adapter_test2.csv");
        const brokerTransactions = await BoursoramaAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date(2023, 2, 6), // 2023-03-06
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 219_89,
        });
        assertEquals(brokerTransactions.length, 1);
    }
});

Deno.test({
    name: "Boursorama adapter converting csv to taxable transactions test 3",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Boursorama_adapter_test3.csv");
        const brokerTransactions = await BoursoramaAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date(2023, 3, 3), // 2023-04-03
            isin: "LU1781541179",
            currency: CurrencyCode.EUR,
            value: 307_28,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date(2023, 3, 3), // 2023-04-03
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 290_80,
        });
        assertEquals(brokerTransactions.length, 2);
    }
});
