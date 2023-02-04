import { CurrencyCode, getCurrencyExchangeRatesMap, getSecurity, SecurityType } from "./tobcalc-lib.js";
import type { ETF } from "./tobcalc-lib.js";

// TODO: use informative error instead of string?
export async function runTests(): Promise<string | null> {
    try {
        const securityIWDA = await getSecurity("IE00B4L5Y983");
        if(securityIWDA.type !== SecurityType.ETF) {
            return "Wrong security type for IWDA";
        }
        if(!(<ETF> securityIWDA).accumulating) {
            return "Wrong security data for IWDA (showing as distributing)";
        }
    } catch(error) {
        return "Could not get security data for IWDA";
    }

    try {
        const securityVWCE = await getSecurity("IE00BK5BQT80");
        if(securityVWCE.type !== SecurityType.ETF) {
            return "Wrong security type for VWCE";
        }
        if(!(<ETF> securityVWCE).accumulating) {
            return "Wrong security data for VWCE (showing as distributing)";
        }
    } catch(error) {
        return "Could not get security data for VWCE";
    }

    const start = new Date("21 February 2022 00:00:00 GMT");
    const end = new Date("25 February 2022 00:00:00 GMT");
    const expectedRates: { [date: string]: number} = {
        "2022-02-21": 1.1338,
        "2022-02-22": 1.1342,
        "2022-02-23": 1.1344,
        "2022-02-24": 1.1163,
        "2022-02-25": 1.1216,
    };
    try {
        const rates = await getCurrencyExchangeRatesMap(start, end, CurrencyCode.USD)
        if(rates === undefined) {
            return "Failed exchange rates test";
        }
        for(const date in expectedRates) {
            if(expectedRates[date] !== rates.get(date)) {
                return "Failed exchange rates test";
            }
        }
    } catch(error) {
        return "Failed exchanges rates test";
    }

    return null;
}
