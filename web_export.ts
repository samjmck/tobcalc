import { IBKRAdapter } from "./src/adapters/IBKR_adapter.ts";
import { DEGIROAdapter } from "./src/adapters/DEGIRO_adapter.ts";
import { Trading212Adapter } from "./src/adapters/Trading212_adapter.ts";
import { BoursoramaAdapter } from "./src/adapters/Boursorama_adapter.ts";
import { InformativeError } from "./src/InformativeError.ts";
import {
    setECBUrlStart,
    setJustETFUrlStart,
    setYahooFinanceQuery1UrlStart,
    exchangeRatesMap,
    getDefaultSecuritiesMap,
    getSecurity,
    getExchangeRatesMap,
    getCurrencyExchangeRatesMap
} from "./src/data.ts";
import { getTaxableTransactions, getTaxFormData, getDefaultTaxRate } from "./src/tax.ts";
import { isNameRegistered } from "./src/tax.ts";
import { CurrencyCode, SecurityType } from "./src/enums.ts";
import { formatMoney } from "./src/formatting.ts";

// Re-export functions that would be used in a webapp
export {
    IBKRAdapter,
    Trading212Adapter,
    DEGIROAdapter,
    BoursoramaAdapter,
    InformativeError,
    exchangeRatesMap,
    SecurityType,
    CurrencyCode,
    formatMoney,
    isNameRegistered,
    setECBUrlStart, setJustETFUrlStart, setYahooFinanceQuery1UrlStart, getDefaultSecuritiesMap, getSecurity,
    getCurrencyExchangeRatesMap, getExchangeRatesMap,
    getTaxableTransactions, getTaxFormData, getDefaultTaxRate,
};
