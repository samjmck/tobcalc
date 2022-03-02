import { IBKR_adapter } from "./src/adapters/IBKR_adapter.ts";

import { cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname } from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData, getTaxRate } from "./src/tax.ts";
import { fillPdf } from "./src/pdf.ts";

// Re-export functions that would be used in a webapp
export {
    IBKR_adapter,
    cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname,
    getTaxableTransactions, getTaxFormData, getTaxRate,
    fillPdf,
};
