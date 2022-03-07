import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

function formatMoney(value: number) {
    const remainder = Math.ceil(value % 100);
    const formattedRemainder = remainder < 10 ? `0${remainder}` : `${remainder}`;
    return `€ ${Math.floor((value - value % 100) / 100)},${formattedRemainder}`;
}

// Given a PDF file that has the text fields we except in a TOB pdf
// and given all the values that need to be filled into those text fields
// this will return the bytes of a PDF with those values filled into the
// text fields
export async function fillPdf(
    pdfFile: Uint8Array,
    params: {
        start: Date,
        end: Date,
        nationalRegistrationNumber: string,
        fullName: string,
        addressLine1: string,
        addressLine2: string,
        addressLine3: string,
        tableATax012Quantity: number,
        tableATax035Quantity: number,
        tableATax132Quantity: number,
        tableATax012TaxBase: number,
        tableATax035TaxBase: number,
        tableATax132TaxBase: number,
        tableATax012TaxValue: number,
        tableATax035TaxValue: number,
        tableATax132TaxValue: number,
        tableATotalTaxValue: number,
        totalTaxValue: number,
        signaturePng: Uint8Array | null,
        signatureName: string,
        signatureCapacity: string,
        location: string,
        date: string,
    }
): Promise<Uint8Array> {
    const document = await PDFDocument.load(pdfFile);
    const form = await document.getForm();

    const startMonthField = form.getTextField("month_1");
    const endMonthField = form.getTextField("month_2");
    const startYearField = form.getTextField("year_1");
    const endYearField = form.getTextField("year_2");

    const nationalRegistrationNumberField = form.getTextField("national_registration_number");

    const fullNameField = form.getTextField("full_name");

    const addressLine1Field = form.getTextField("address_line_1");
    const addressLine2Field = form.getTextField("address_line_2");
    const addressLine3Field = form.getTextField("address_line_3");

    const tableATax012QuantityField = form.getTextField("table_a_tax_012_quantity");
    const tableATax012TaxBaseField = form.getTextField("table_a_tax_012_tax_base");
    const tableATax012TaxValueField = form.getTextField("table_a_tax_012_tax_value");

    const tableATax035QuantityField = form.getTextField("table_a_tax_035_quantity");
    const tableATax035TaxBaseField = form.getTextField("table_a_tax_035_tax_base");
    const tableATax035TaxValueField = form.getTextField("table_a_tax_035_tax_value");

    const tableATax132QuantityField = form.getTextField("table_a_tax_132_quantity");
    const tableATax132TaxBaseField = form.getTextField("table_a_tax_132_tax_base");
    const tableATax132TaxValueField = form.getTextField("table_a_tax_132_tax_value");
    
    const tableATotalTaxValue = form.getTextField("table_a_total_tax_value");
    const totalTaxValue = form.getTextField("total_tax_value");

    const locationField = form.getTextField("location");
    const dateField = form.getTextField("date");

    const signatureField = form.getTextField("signature");
    const signatureNameField = form.getTextField("signature_name");
    const signatureCapacityField = form.getTextField("signature_capacity");
    
    startMonthField.setText(`${params.start.getMonth() + 1}`);
    startYearField.setText(`${params.start.getFullYear()}`);
    endMonthField.setText(`${params.end.getMonth() + 1}`);
    endYearField.setText(`${params.end.getFullYear()}`);

    nationalRegistrationNumberField.setText(params.nationalRegistrationNumber);
    
    fullNameField.setText(params.fullName);
    
    addressLine1Field.setText(params.addressLine1);
    addressLine2Field.setText(params.addressLine2);
    addressLine3Field.setText(params.addressLine3);
    
    tableATax012QuantityField.setText(`${params.tableATax012Quantity}`);
    tableATax012TaxBaseField.setText(`${formatMoney(params.tableATax012TaxBase)}`);
    tableATax012TaxValueField.setText(`${formatMoney(params.tableATax012TaxValue)}`);

    tableATax035QuantityField.setText(`${params.tableATax035Quantity}`);
    tableATax035TaxBaseField.setText(`${formatMoney(params.tableATax035TaxBase)}`);
    tableATax035TaxValueField.setText(`${formatMoney(params.tableATax035TaxValue)}`);

    tableATax132QuantityField.setText(`${params.tableATax132Quantity}`);
    tableATax132TaxBaseField.setText(`${formatMoney(params.tableATax132TaxBase)}`);
    tableATax132TaxValueField.setText(`${formatMoney(params.tableATax132TaxValue)}`);

    tableATotalTaxValue.setText(`${formatMoney(params.tableATotalTaxValue)}`);
    totalTaxValue.setText(`${formatMoney(params.totalTaxValue)}`)
    locationField.setText(params.location);
    dateField.setText(params.date);

    if(params.signaturePng !== null) {
        signatureField.setImage(await document.embedPng(params.signaturePng));
    }
    signatureNameField.setText(params.signatureName);
    signatureCapacityField.setText(params.signatureCapacity);

    return document.save();
}
