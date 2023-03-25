import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { InformativeError } from "../InformativeError.ts";
import { moneyToNumber } from "../broker_reading.ts";

export const ETradeAdapter: BrokerAdapter = async data => {
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
  const dateColumnIndex = columnNames.indexOf(`"TRADE DATE"`);
  const isinColumnIndex = columnNames.indexOf(`"SYMBOL/CUSIP"`);
  const currencyCodeColumnIndex = columnNames.indexOf(`"CURRENCY"`);
  const quantityColumnIndex = columnNames.indexOf(`"QUANTITY"`);
  const priceColumnIndex = columnNames.indexOf(`"PRICE"`);

  if(dateColumnIndex === -1) {
    throw new InformativeError("etrade_adapter.date_column_index", columnNames);
  }
  // if(isinColumnIndex === -1) {
  //   throw new InformativeError("ibkr_adapter.isin_column_index", columnNames);
  // }
  if(quantityColumnIndex === -1) {
    throw new InformativeError("etrade_adapter.value_column_index", columnNames);
  }
  if(priceColumnIndex === -1) {
    throw new InformativeError("etrade_adapter.value_column_index", columnNames);
  }
  if(currencyCodeColumnIndex === -1) {
    throw new InformativeError("etrade_adapter.currency_code_column_index", columnNames);
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

        // if(row[isinColumnIndex] === undefined) {
        //     throw new InformativeError("ibkr_adapter.isin_undefined", { row, columnNames });
        // }
        if(row[currencyCodeColumnIndex] === undefined) {
            throw new InformativeError("etrade_adapter.currency_code_undefined", { row, columnNames });
        }
        if(row[quantityColumnIndex] === undefined) {
            throw new InformativeError("etrade_adapter.quantity_undefined", { row, columnNames });
        }
        if(row[priceColumnIndex] === undefined) {
            throw new InformativeError("etrade_adapter.price_undefined", { row, columnNames });
        }

        // Currency exchange transactions have empty ISINs. We want to ignore these transactions
        if(row[isinColumnIndex] === "") {
            continue;
        }
        const value = moneyToNumber(row[priceColumnIndex]) * moneyToNumber(row[quantityColumnIndex]) / 100

        const data = {
           // Date is in format YYYYMMDD
           date: new Date(`20${dateString.substring(6)}-${dateString.substring(0, 2)}-${dateString.substring(3, 5)}`),
           isin: row[isinColumnIndex],
           currency: <CurrencyCode> row[currencyCodeColumnIndex],
           // Number() to convert string into number and * 100 to convert into integer
           value,
        }
        console.log(data)
        brokerTransactions.push(data);
    }
    return brokerTransactions;
}
