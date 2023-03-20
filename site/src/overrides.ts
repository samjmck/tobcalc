import type { Security, TaxableTransaction, TaxRateFunction } from "./tobcalc-lib.js";
import { getDefaultTaxRate, getSecurity, SecurityType } from "./tobcalc-lib.js";

export const taxRates = [
    0.0012,
    0.0035,
    0.0132,
];

export function getTaxRateWithOverrides(overrides: Map<string, number>): TaxRateFunction {
    return (taxableTransaction: TaxableTransaction) => {
        const override = overrides.get(taxableTransaction.security.isin);
        if(override !== undefined) {
            return override;
        }
        return getDefaultTaxRate(taxableTransaction);
    };
}

// We are going to hardcode some data for securities which are popular in the BEFIRE
// community, but have incorrect/incomplete data from Yahoo Finance
const hardcodedSecurities = new Map<string, Security>([
    [
        "IE00BDBRDM35",
        {
            type: SecurityType.ETF,
            name: "iShares Core Global Aggregate Bond UCITS ETF",
            isin: "IE00BDBRDM35",
            accumulating: true,
        }
    ]
]);


export async function getSecuritiesMapWithOverrides(
    isins: string[],
    getFailedIsinsSecurities: (failedIsins: string[]) => Promise<Map<string, Security>>,
): Promise<Map<string, Security>> {
    const securitiesMap = new Map<string, Security>();
    const failedIsins = [];
    const promises = [];
    for(const isin of isins) {
        const hardcodedSecurity = hardcodedSecurities.get(isin);
        if(hardcodedSecurity !== undefined) {
            securitiesMap.set(isin, hardcodedSecurity);
        } else {
            promises.push(
                getSecurity(isin)
                    .then(security => securitiesMap.set(isin, security))
                    .catch(() => failedIsins.push(isin))
            );
        }
    }
    await Promise.all(promises);
    const failedSecuritiesMap = await getFailedIsinsSecurities(failedIsins);

    return new Map([...securitiesMap, ...failedSecuritiesMap]);
}