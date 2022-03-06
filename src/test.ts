const bytes = await Deno.readFile("IBKR_adapter_test.csv");
const blob = new Blob([bytes]);
const brokerTransactions = await IBKRAdapter(blob);
console.log(brokerTransactions);

const taxableTransactions = await getTaxableTransactions(brokerTransactions);
console.log(taxableTransactions);

const taxFormData = getTaxFormData(taxableTransactions);
for(const [key, value] of taxFormData) {
    console.log(key, value);
}

import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import { getTaxableTransactions, getTaxFormData } from "./tax.ts";
import { IBKRAdapter } from "./adapters/IBKR_adapter.ts";

const file = await Deno.readFile("TD-OB1-NL-empty-fillable-pdfa.pdf");
const signatureFile = await Deno.readFile("signature.png");
const pdfDoc = await PDFDocument.load(file);
const form = pdfDoc.getForm();
form.getTextField("signature").setImage(await pdfDoc.embedPng(signatureFile));
form.getTextField("full_name").setText("Full Name");

const updatedPdf = await pdfDoc.save();
await Deno.writeFile("generated.pdf", updatedPdf);
