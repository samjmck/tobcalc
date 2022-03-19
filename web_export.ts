import { IBKRAdapter } from "./src/adapters/IBKR_adapter.ts";
import { InformativeError } from "./src/InformativeError.ts";
import { cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname, exchangeRatesMap } from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData, getTaxRate } from "./src/tax.ts";
import { CurrencyCode, SecurityType } from "./src/enums.ts";
import { formatMoney } from "./src/formatting.ts";

// Re-export functions that would be used in a webapp
export {
    IBKRAdapter,
    InformativeError,
    exchangeRatesMap,
    SecurityType,
    CurrencyCode,
    formatMoney,
    cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname,
    getTaxableTransactions, getTaxFormData, getTaxRate,
};
