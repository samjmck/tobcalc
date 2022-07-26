// @deno-types="https://unpkg.com/xlsx/types/index.d.ts"
import * as XLSX from 'https://unpkg.com/xlsx/xlsx.mjs';
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { CurrencyCode } from "../enums.ts";
import { moneyToNumber } from "../broker_reading.ts";

export const eToroAdapter: BrokerAdapter = async data => {
    const workbook = XLSX.read(await data.arrayBuffer());
    const sheet = workbook.Sheets["Closed Positions"]
    // https://docs.sheetjs.com/docs/csf/sheet/#sheet-properties
    if(sheet["!ref"] !== undefined) {
        // Note: rows that have an empty value in a column will be "undefined"
        // https://docs.sheetjs.com/docs/api/utilities#json
        const values = <{ [key: string ]: string }[]> XLSX.utils.sheet_to_json(sheet, {
            range: sheet["!ref"],
            raw: false,         // Keep numbers as they were in spreadsheet. We will
                                // parse them ourselves
            blankrows: false,   // Skip empty rows. The "range" of the spreadsheet
                                // that gives the number of columns is not accurate
                                // and is always larger than the actual number
        });

        const brokerTransactions: BrokerTransaction[] = [];
        for(const row of values) {
            if(row["ISIN"] === undefined) {
                continue;
            }
            const openDateString = row["Open Date"];
            const openTransaction: BrokerTransaction = {
                // Date is in format DD/MM/YYYY
                date: new Date(`${openDateString.substring(6, 10)}-${openDateString.substring(3, 5)}-${openDateString.substring(0, 2)}`),
                isin: row["ISIN"],
                currency: CurrencyCode.EUR,
                value: moneyToNumber(row["Close Rate"]),
            };
        }
    }
    return [];
};
