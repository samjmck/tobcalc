import { BousoramaAdapter } from "./Boursorama_adapter.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";

Deno.test({
    name: "Boursorama adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/Boursorama_adapter_test.csv");
        const brokerTransactions = await BousoramaAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <BrokerTransaction> {
            date: new Date(2023, 2, 6),
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 219_24,
        });
        assertEquals(brokerTransactions[1], <BrokerTransaction> {
            date: new Date(2023, 2, 2),
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 144_66,
        });
        
        assertEquals(brokerTransactions.length, 2);
    },
});
