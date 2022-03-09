# How to add a broker

To add a broker, you need to write a `ServiceAdapter` which takes a data `Blob` as input and outputs an array of `ServiceTransaction`s. 

The interfaces for `ServiceAdapter` and `ServiceTransaction` are defined in `src/service_adapter` as followed:

```ts
interface ServiceTransaction {
    date: Date;
    isin: string;
    currency: CurrencyCode;
    value: number;
}
interface ServiceAdapter {
    (data: Blob): Promise<ServiceTransaction[]>;
}
```

On a higher level, you should view a service adapter as a function that simply receives data representing the transactions on a given service (such as a broker or bank) and converts that data into a format the codebase understands. The data the function receives is normally in the form of a `csv` or `xlsx` file with raw data wrapped in a `Blob` object.

Start with defining a function that implements the `SeriviceAdapter` interface, as follows:

```ts
const MyAdapter: ServiceAdapter = async (data) => {
    const serviceTransactions: ServiceTransaction[] = [];
    return serviceTransactions;
};
```

The `data` parameter is of the [`Blob` type](https://developer.mozilla.org/en-US/docs/Web/API/Blob), meaning you can call methods such as `text()` to get the file as a string or `stream()` to get a `ReadableStream`. See `src/adapters/IBKR_adapter.ts` for a concrete example of how to process a `csv` file:

```ts
export const IBKRAdapter: ServiceAdapter = async data => {
    // Convert data blob to a string
    const text = await data.text();
    
    // Rows are separated by a line break or "\n", we want to split the string up into the rows
    // separated by \n
    const rows = text.split("\n");
    
    // The first row of a csv contains the names of columns
    const columnNamesRow = rows[0];
    
    // Each column in a row is seperated by a comma - we can get the column names by splitting
    // the first row by 
    const columnNames = rows[0].split(",");

    // Recall the properties of a ServiceTransaction: date, isin, currency and value
    // We want to extract these properties from the input data
    // To do so, we need the indexes of the columns of those properties
    // We can find them by looking in the header row with the column names
    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);

    const serviceTransactions: ServiceTransaction[] = [];
    // Now we want to loop over all the rows except the header row, hence the slice(1, -1)
    for(const rowString of rows.slice(1, -1)) {
        // Split the columns of the row into an array
        // And then remove the quotes which encapsulate every column value
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        
        // Save date in a variable so we can easily reuse while creating a Date object
        const dateString = row[dateColumnIndex];

        serviceTransactions.push({
            // Date is in format YYYYMMDD
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            // Number() to convert string into number and * 100 to convert into integer
            value: Number(row[valueColumnIndex]) * 100,
        });
    }
    return serviceTransactions;
};
```
