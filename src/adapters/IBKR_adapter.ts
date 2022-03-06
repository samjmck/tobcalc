import { CurrencyCode } from "../enums.ts";
import { ServiceAdapter, ServiceTransaction } from "../service_adapter.ts";

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
    for (const rowString of rows.slice(1, -1)) {
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        const dateString = row[dateColumnIndex];
        serviceTransactions.push({
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode>row[currencyCodeColumnIndex],
            value: Number(row[valueColumnIndex]) * 100,
        });
    }
    return serviceTransactions;
};
