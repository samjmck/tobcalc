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
            isin: "IE00B4L5Y983",
            currency: CurrencyCode.EUR,
            value: 357_36,
        });
        assertEquals(serviceTransactions[1], <ServiceTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BK5BQT80",
            currency: CurrencyCode.EUR,
            value: 791_75,
        });
        assertEquals(serviceTransactions[2], <ServiceTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 1305_57,
        });
        assertEquals(serviceTransactions[3], <ServiceTransaction> {
            date: new Date("2022-02-02"),
            isin: "US0378331005",
            currency: CurrencyCode.USD,
            value: 1381_75,
        });
        assertEquals(serviceTransactions[4], <ServiceTransaction> {
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 303_11,
        });
    },
});
