import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { InformativeError } from "../InformativeError.ts";
import { moneyToNumber } from "../broker_reading.ts";

export const IBKRAdapter: BrokerAdapter = async data => {
    // Convert data blob to a string
    const text = await data.text();

    // Rows are separated by a line break or "\n", we want to split the string up into the rows
    // separated by \n
    const rows = text.split("\n");

    // Each column in a row is seperated by a comma - we can get the column names by splitting
    // the first row
    const columnNames = rows[0].split(",");

    // Recall the properties of a BrokerTransaction: date, isin, currency and value
    // We want to extract these properties from the input data
    // To do so, we need the indexes of the columns of those properties
    // We can find them by looking in the header row with the column names
    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);

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

    const brokerTransactions: BrokerTransaction[] = [];
    // Now we want to loop over all the rows except the header row, hence the slice(1, -1)
    for(const rowString of rows.slice(1)) {
        // Often the sheets have an empty line at the end
        if(rowString === "") {
            continue;
        }

        // Split the columns of the row into an array
        // And then remove the quotes which encapsulate every column value
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));

        // Save date in a variable so we can easily reuse while creating a Date object
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

        // Currency exchange transactions have empty ISINs. We want to ignore these transactions
        if(row[isinColumnIndex] === "") {
            continue;
        }

        brokerTransactions.push({
            // Date is in format YYYYMMDD
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            // Number() to convert string into number and * 100 to convert into integer
            // Ignore the minus sign, we only care about absolute value of transaction
            value: moneyToNumber(row[valueColumnIndex].replace("-", "")),
        });
    }
    return brokerTransactions;
};
