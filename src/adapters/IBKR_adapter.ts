import { CurrencyCode } from "../enums.ts";
import { ServiceAdapter, ServiceTransaction } from "../service_adapter.ts";
import { InformativeError } from "../InformativeError.ts";

// Ugly syntax but is there any other way to type annotate a function signature?
// <ServiceAdapter> async function IBKR_adapter(...) { ...} doesn't work
export const IBKRAdapter: ServiceAdapter = async data => {
    const text = await data.text();
    const rows = text.split("\n");
    const columnNames = rows[0].split(",");
    const serviceTransactions: ServiceTransaction[] = [];

    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);

    if(dateColumnIndex === -1) {
        throw new InformativeError("ibkr_adapter.date_column_index", columnNames);
    }
    if(isinColumnIndex === -1) {
        throw new InformativeError("ibkr_adapter.isin_column_index", columnNames);
    }
    if(valueColumnIndex === -1) {
        throw new InformativeError("ibkr_adapter.value_column_index", columnNames);
    }
    if(currencyCodeColumnIndex === -1) {
        throw new InformativeError("ibkr_adapter.currency_code_column_index", columnNames);
    }

    for (const rowString of rows.slice(1, -1)) {
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        const dateString = row[dateColumnIndex];

        if(row[isinColumnIndex] === undefined) {
            throw new InformativeError("ibkr_adapter.isin_undefined", { row, columnNames });
        }
        if(row[currencyCodeColumnIndex] === undefined) {
            throw new InformativeError("ibkr_adapter.currency_code_undefined", { row, columnNames });
        }
        if(row[valueColumnIndex] === undefined) {
            throw new InformativeError("ibkr_adapter.value_undefined", { row, columnNames });
        }

        serviceTransactions.push({
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            value: Number(row[valueColumnIndex]) * 100,
        });
    }
    return serviceTransactions;
};
