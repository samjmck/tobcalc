import { IBKRAdapter } from "./src/adapters/IBKR_adapter.ts";

import { cacheExchangeRates, getSecurity } from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData } from "./src/tax.ts";
import { fillPdf } from "./src/pdf.ts";

// Re-export functions that would be used in a webapp
export {
    IBKRAdapter,
    cacheExchangeRates, getSecurity,
    getTaxableTransactions, getTaxFormData,
    fillPdf,
};
