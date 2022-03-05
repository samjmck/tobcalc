import { IBKRAdapter } from "./src/adapters/IBKR_adapter.ts";

import { cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname } from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData, getTaxRate } from "./src/tax.ts";

// Re-export functions that would be used in a webapp
export {
    IBKRAdapter,
    cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname,
    getTaxableTransactions, getTaxFormData, getTaxRate,
};
