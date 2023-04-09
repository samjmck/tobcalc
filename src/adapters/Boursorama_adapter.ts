import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { InformativeError } from "../InformativeError.ts";
import { moneyToNumber } from "../broker_reading.ts";

export const BoursoramaAdapter: BrokerAdapter = async data => {
    // Convert data blob to a string
    const text = await data.text();

    // Rows are separated by a line break or "\n", we want to split the string up into the rows
    // separated by \n
    const rows = text.split("\n");

    // Each column in a row is seperated by a semicolon - we can get the column names by splitting
    // the first row
    const columnNames = rows[0].split(";");

    // Recall the properties of a BrokerTransaction: date, isin and value
    // We want to extract these properties from the input data
    // To do so, we need the indexes of the columns of those properties
    // We can find them by looking in the header row with the column names
    // Note: Boursorama exports are always in French
    const dateColumnIndex = columnNames.indexOf(`"Date opération"`);
    const isinColumnIndex = columnNames.indexOf(`"Code ISIN"`);
    const valueColumnIndex = columnNames.indexOf(`Montant`);

    // In the sample data set, there is no currency column and all transactions seem
    // to be translated to EUR, so enforce this currency
    const boursoramaCurrencyCode = "EUR";

    if(dateColumnIndex === -1) {
        throw new InformativeError("boursorama_adapter.date_column_index", columnNames);
    }
    if(isinColumnIndex === -1) {
        throw new InformativeError("boursorama_adapter.isin_column_index", columnNames);
    }
    if(valueColumnIndex === -1) {
        throw new InformativeError("boursorama_adapter.value_column_index", columnNames);
    }

    const brokerTransactions: BrokerTransaction[] = [];
    // Now we want to loop over all the rows except the header row, hence the slice(1, -1)
    for(const rowString of rows.slice(1)) {
        // Often the sheets have an empty line at the end
        if(rowString === "") {
            continue;
        }

        // remove the quotes only if the value contains quotes
        const removeSurroundingQuotesIfExist = function(value: string): string {
            return value.startsWith(`"`) ? value.substring(1, value.length - 1) : value;
        }

        // Split the columns of the row into an array
        // Boursorama CSV separator is semi-colon
        const row = rowString.split(";").map(removeSurroundingQuotesIfExist);

        // Save date in a variable so we can easily reuse while creating a Date object
        const dateString = row[dateColumnIndex];

        if(row[isinColumnIndex] === undefined) {
            throw new InformativeError("boursorama_adapter.isin_undefined", { row, columnNames });
        }
        if(row[valueColumnIndex] === undefined) {
            throw new InformativeError("boursorama_adapter.value_undefined", { row, columnNames });
        }

        // Ignore if ISIN is empty (eg cash balance statements, in case
        // user forgot to filter them out)
        if(row[isinColumnIndex] === "") {
            continue;
        }

        brokerTransactions.push({
            // Date is in format DD/MM/YYYY
            date: new Date(+`${dateString.substring(6, 10)}`, +`${dateString.substring(3, 5)}`-1, +`${dateString.substring(0, 2)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> boursoramaCurrencyCode,
            // moneyToNumber() to convert string into number and * 100 to convert into integer
            // Ignore the minus sign, we only care about absolute value of transaction
            value: moneyToNumber(row[valueColumnIndex].replace("-", "")),
        });
    }
    return brokerTransactions;
};
