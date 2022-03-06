import { IBKRAdapter } from "./IBKR_adapter.ts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { ServiceTransaction } from "../service_adapter.ts";
import { CurrencyCode } from "../enums.ts";

Deno.test({
    name: "IBKR adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/IBKR_adapter_test.csv");
        const serviceTransactions = await IBKRAdapter(new Blob([data]));

        assertEquals(serviceTransactions[0], <ServiceTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 1381_75,
        });
    },
});
