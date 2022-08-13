import { IBKRAdapter } from "./src/adapters/IBKR_adapter.ts";
import { DEGIROAdapter } from "./src/adapters/DEGIRO_adapter.ts";
import { Trading212Adapter } from "./src/adapters/Trading212_adapter.ts";
import { InformativeError } from "./src/InformativeError.ts";
import { cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname, exchangeRatesMap } from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData, getTaxRate } from "./src/tax.ts";
import { isNameRegistered } from "./src/tax.ts";
import { CurrencyCode, SecurityType } from "./src/enums.ts";
import { formatMoney } from "./src/formatting.ts";

// Re-export functions that would be used in a webapp
export {
    IBKRAdapter,
    Trading212Adapter,
    DEGIROAdapter,
    InformativeError,
    exchangeRatesMap,
    SecurityType,
    CurrencyCode,
    formatMoney,
    isNameRegistered,
    cacheExchangeRates, getSecurity, setECBHostname, setInvestingComHostname,
    getTaxableTransactions, getTaxFormData, getTaxRate,
};
