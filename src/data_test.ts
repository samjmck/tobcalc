import { assertEquals, assertNotEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";
import { cacheExchangeRates, exchangeRatesMap, getSecurity } from "./data.ts";
import { CurrencyCode, ETF, SecurityType } from "./enums.ts";

Deno.test({
    name: "EURUSD exchange rates between 21 February 2022 and 25 February 2022",
    permissions: {
        net: true,
    },
    fn: async () => {
        const start = new Date("21 February 2022 00:00:00 GMT");
        const end = new Date("25 February 2022 00:00:00 GMT");
        await cacheExchangeRates(start, end, CurrencyCode.USD);
        assertNotEquals(exchangeRatesMap.get(CurrencyCode.USD), undefined);
        const expectedRates: { [date: string]: number} = {
            "2022-02-21": 1.1338,
            "2022-02-22": 1.1342,
            "2022-02-23": 1.1344,
            "2022-02-24": 1.1163,
            "2022-02-25": 1.1216,
        };
        const rates = <Map<string, number>> exchangeRatesMap.get(CurrencyCode.USD);

        for(const date in expectedRates) {
            assertEquals(expectedRates[date], rates.get(date));
        }
    }
});

// Test most popular ETFs within BEFIRE
Deno.test({
    name: "IWDA IE00B4L5Y983 accumulating ETF iShares Core MSCI World UCITS",
    permissions: {
        net: true,
    },
    fn: async () => {
        const security = <ETF> (await getSecurity("IE00B4L5Y983"));
        assertEquals(security.type, SecurityType.ETF);
        assertEquals(security.accumulating, true);
    },
});
Deno.test({
    name: "VWCE IE00BK5BQT80 accumulating ETF Vanguard FTSE All-World UCITS",
    permissions: {
        net: true,
    },
    fn: async () => {
        const security = <ETF> (await getSecurity("IE00BK5BQT80"));
        assertEquals(security.type, SecurityType.ETF);
        assertEquals(security.accumulating, true);
    },
});
Deno.test({
    name: "SWRD IE00BFY0GT14 accumulating ETF SPDR MSCI World UCITS",
    permissions: {
        net: true,
    },
    fn: async () => {
        const security = <ETF> (await getSecurity("IE00BFY0GT14"));
        assertEquals(security.type, SecurityType.ETF);
        assertEquals(security.accumulating, true);
    },
});
Deno.test({
    name: "IWDR IE00B0M62Q58 distributing ETF iShares MSCI World UCITS",
    permissions: {
        net: true,
    },
    fn: async () => {
        const security = <ETF> (await getSecurity("IE00B0M62Q58"));
        assertEquals(security.type, SecurityType.ETF);
        assertEquals(security.accumulating, false);
    },
});
Deno.test({
    name: "AAPL US0378331005 stock Apple Inc",
    permissions: {
        net: true,
    },
    fn: async () => {
        const security = <ETF> (await getSecurity("US0378331005"));
        assertEquals(security.type, SecurityType.Stock);
    },
});
