import type { Security, TaxableTransaction, TaxRateFunction } from "./tobcalc-lib";
import { getSecurity, getDefaultTaxRate } from "./tobcalc-lib.js";

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

export async function getSecuritiesMapWithOverrides(
    isins: string[],
    getFailedIsinsSecurities: (failedIsins: string[]) => Promise<Map<string, Security>>,
): Promise<Map<string, Security>> {
    const securitiesMap = new Map<string, Security>();
    const failedIsins = [];
    const promises = [];
    for(const isin of isins) {
        promises.push(
            getSecurity(isin)
                .then(security => securitiesMap.set(isin, security))
                .catch(() => failedIsins.push(isin))
        );
    }
    await Promise.all(promises);
    const failedSecuritiesMap = await getFailedIsinsSecurities(failedIsins);

    return new Map([...securitiesMap, ...failedSecuritiesMap]);
}