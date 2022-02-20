import { IBKRAdapter, getTaxableTransactions, getTaxFormData } from "./broker.ts";

const bytes = await Deno.readFile("Trades.csv");
const blob = new Blob([bytes]);
const brokerTransactions = await IBKRAdapter(blob);
console.log(brokerTransactions);

const taxableTransactions = await getTaxableTransactions(brokerTransactions);
console.log(taxableTransactions);

const taxFormData = getTaxFormData(taxableTransactions);
for(const [key, value] of taxFormData) {
    console.log(key, value);
}
