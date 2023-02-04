# How to add a broker

To add a broker, you need to write a `BrokerAdapter` which takes a data `Blob` as input and outputs an array of `BrokerTransaction`. 

The interfaces for `BrokerAdapter` and `BrokerTransaction` are defined in `src/broker_adapter` as followed:

```ts
interface BrokerTransaction {
    date: Date;
    isin: string;
    currency: CurrencyCode;
    value: number;
}
interface BrokerAdapter {
    (data: Blob): Promise<BrokerTransaction[]>;
}
```

At a high level, you should view a broker adapter as a function that simply receives data representing the transactions from a broker/bank and converts that data into a format the codebase understands. The data the function receives is normally in the form of a `csv` or `xlsx` file with raw data wrapped in a `Blob` object.

Start with defining a function that implements the `BrokerAdapter` interface, as follows:

```ts
const MyAdapter: BrokerAdapter = async (data) => {
    const brokerTransactions: BrokerTransaction[] = [];
    return brokerTransactions;
};
```

The `data` parameter is of the [`Blob` type](https://developer.mozilla.org/en-US/docs/Web/API/Blob), meaning you can call methods such as `text()` to get the file as a string or `stream()` to get a `ReadableStream`. See `src/adapters/IBKR_adapter.ts` for a concrete example of how to process a `csv` file:

```ts
export const IBKRAdapter: BrokerAdapter = async data => {
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

    // Recall the properties of a BrokerTransaction: date, isin, currency and value
    // We want to extract these properties from the input data
    // To do so, we need the indexes of the columns of those properties
    // We can find them by looking in the header row with the column names
    const dateColumnIndex = columnNames.indexOf(`"TradeDate"`);
    const isinColumnIndex = columnNames.indexOf(`"ISIN"`);
    const currencyCodeColumnIndex = columnNames.indexOf(`"CurrencyPrimary"`);
    const valueColumnIndex = columnNames.indexOf(`"Amount"`);

    const brokerTransactions: BrokerTransaction[] = [];
    // Now we want to loop over all the rows except the header row, hence the slice(1, -1)
    for(const rowString of rows.slice(1, -1)) {
        // Split the columns of the row into an array
        // And then remove the quotes which encapsulate every column value
        const row = rowString.split(",").map(s => s.substring(1, s.length - 1));
        
        // Save date in a variable so we can easily reuse while creating a Date object
        const dateString = row[dateColumnIndex];

        brokerTransactions.push({
            // Date is in format YYYYMMDD
            date: new Date(`${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`),
            isin: row[isinColumnIndex],
            currency: <CurrencyCode> row[currencyCodeColumnIndex],
            // Number() to convert string into number and * 100 to convert into integer
            value: Number(row[valueColumnIndex]) * 100,
        });
    }
    return brokerTransactions;
};
```

Once you have written the adapter for your broker, you should add a unit test for it. `src/IBKR_adapter_test.ts` provides a good template or starting point for doing so:

```ts
Deno.test({
    name: "adapter converting csv to taxable transactions",
    permissions: {
        read: true,
    },
    fn: async () => {
        const data = await Deno.readFile("src/adapters/broker_adapter_test.csv");
        const brokerTransactions = await IBKRAdapter(new Blob([data]));

        assertEquals(brokerTransactions[0], <Brokerransaction> {
            // Depending on the example data in your file
            date: new Date("2022-02-02"),
            isin: "IE00BFY0GT14",
            currency: CurrencyCode.EUR,
            value: 1381_75,
        });
    },
});
```
