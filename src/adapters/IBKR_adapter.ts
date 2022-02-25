import { CurrencyCode } from "../enums.ts";
import { ServiceTransaction } from "../service_adapter.ts";

export async function IBKRAdapter(data: Blob): Promise<ServiceTransaction[]> {
    const text = await data.text();
    const rows = text.split("\n");
    const columnNames = rows[0].split(",");
    const brokerTransactions: ServiceTransaction[] = [];
    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);
    for (const rowString of rows.slice(1, -1)) {
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        const dateString = row[dateColumnIndex];
        brokerTransactions.push({
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode>row[currencyCodeColumnIndex],
            value: Number(row[valueColumnIndex]),
        });
    }
    return brokerTransactions;
}
