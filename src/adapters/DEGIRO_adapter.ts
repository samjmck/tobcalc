import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { InformativeError } from "../InformativeError.ts";
import { moneyToNumber } from "../broker_reading.ts";

export const DEGIROAdapter: BrokerAdapter = async data => {
    const text = await data.text();

    // Rows are separated by a line break or "\n", we want to split the string up into the rows
    // separated by \n
    const rows = text.split("\n");

    // Hardcode column indexes, we can't search for them as language might differ per user's DEGIRO country
    const dateColumnIndex = 0
    const isinColumnIndex = 3;
    const currencyCodeColumnIndex = 8;
    const valueColumnIndex = 9;

    const brokerTransactions: BrokerTransaction[] = [];
    for(const rowString of rows.slice(1)) {
        // Often the sheets have an empty line at the end
        if(rowString === "") {
            continue;
        }

        const row = rowString.split(",");

        // Save date in a variable so we can easily reuse while creating a Date object
        const dateString = row[dateColumnIndex];

        if(row[isinColumnIndex] === undefined) {
            throw new InformativeError("degiro_adapter.isin_undefined", { row });
        }
        if(row[currencyCodeColumnIndex] === undefined) {
            throw new InformativeError("degiro_adapter.currency_code_undefined", { row });
        }
        if(row[valueColumnIndex] === undefined) {
            throw new InformativeError("degiro_adapter.value_undefined", { row });
        }

        let value = moneyToNumber(row[valueColumnIndex]);
        if(value < 0) {
            value *= -1;
        }

        brokerTransactions.push({
            // Date is in format DD-MM-YYYY
            date: new Date(`${dateString.substring(6, 10)}-${dateString.substring(3, 5)}-${dateString.substring(0, 2)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            // Number() to convert string into number and * 100 to convert into integer
            value: value,
        });
    }
    return brokerTransactions;
};
