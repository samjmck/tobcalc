import { CurrencyCode } from "../enums.ts";
import { BrokerAdapter, BrokerTransaction } from "../broker_adapter.ts";
import { InformativeError } from "../InformativeError.ts";

export const Trading212Adapter: BrokerAdapter = async data => {
    const text = await data.text();

    const rows = text.split("\n");

    const columnNames = rows[0].split(",");

    const actionColumnIndex = columnNames.indexOf(`Action`);
    const dateColumnIndex = columnNames.indexOf(`Time`);
    const isinColumnIndex = columnNames.indexOf(`ISIN`);
    const currencyCodeColumnIndex = columnNames.indexOf(`Currency (Price / share)`);
    const numberOfSharesColumnIndex = columnNames.indexOf(`No. of shares`);
    const pricePerShareColumnIndex = columnNames.indexOf(`Price / share`);

    if(actionColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.action_column_index", columnNames);
    }
    if(dateColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.date_column_index", columnNames);
    }
    if(isinColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.isin_column_index", columnNames);
    }
    if(currencyCodeColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.currency_code_column_index", columnNames);
    }
    if(numberOfSharesColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.number_of_shares_column_index", columnNames);
    }
    if(pricePerShareColumnIndex === -1) {
        throw new InformativeError("trading212_adapter.prices_per_share_column_index", columnNames);
    }

    const brokerTransactions: BrokerTransaction[] = [];
    for(const rowString of rows.slice(1, -1)) {
        const row = rowString.split(",");
        if(row[actionColumnIndex].indexOf(`Market sell`) === -1 && row[actionColumnIndex].indexOf(`Market buy`) === -1) {
            continue;
        }

        const dateString = row[dateColumnIndex];

        if(row[isinColumnIndex] === undefined) {
            throw new InformativeError("trading212_adapter.isin_undefined", { row, columnNames });
        }
        if(row[currencyCodeColumnIndex] === undefined) {
            throw new InformativeError("trading212_adapter.currency_code_undefined", { row, columnNames });
        }
        if(row[numberOfSharesColumnIndex] === undefined) {
            throw new InformativeError("trading212_adapter.number_of_shares_undefined", { row, columnNames });
        }
        if(row[pricePerShareColumnIndex] === undefined) {
            throw new InformativeError("trading212_adapter.price_per_share_undefined", { row, columnNames });
        }

        brokerTransactions.push({
            // Date is in format YYYY-MM-DD HH:mm:ss
            date: new Date(dateString.slice(0, 10)),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            value: Number(row[pricePerShareColumnIndex].replace(".", "")) * Number(row[numberOfSharesColumnIndex]),
        });
    }
    return brokerTransactions;
};
