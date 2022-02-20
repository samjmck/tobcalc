import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

function splitMoneyValueForFormField(
    value: number,
): [decimal: string, ...parts: string[]] {
    if(value < 0) {
        value *= -1;
    }
    const decimalNumbers = value - Math.floor(value / 100) * 100;
    const decimalString = `${decimalNumbers < 10 ? "0" + Math.round(decimalNumbers) : Math.round(decimalNumbers)}`;

    const wholeNumbersString = `${Math.floor((value - decimalNumbers) / 100)}`;
    const wholeNumberStrings = [];

    let index = wholeNumbersString.length;
    while(index > 0) {
        let startIndex = index - 3;
        if(startIndex < 0) {
            startIndex = 0;
        }
        wholeNumberStrings.push(wholeNumbersString.substring(startIndex , index));
        index = startIndex;
    }

    return [decimalString, ...wholeNumberStrings];
}

function fillPdf(
    document: PDFDocument,
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
        tableATax132ExtraQuantity: number,
        tableATax012TaxableAmount: number,
        tableATax035TaxableAmount: number,
        tableATax132TaxableAmount: number,
        tableATax132ExtraTaxableAmount: number,
        tableATax012TaxValue: number,
        tableATax035TaxValue: number,
        tableATax132TaxValue: number,
        tableATax132ExtraTaxValue: number,
        tableATotalTaxValue: number,
        totalTaxValue: number,
        location: string,
        date: string,
    }
): Promise<Uint8Array> {
    const form = document.getForm();

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
    const tableATax012TaxableAmountDecimalField = form.getTextField("table_a_tax_012_taxable_amount_decimal");
    const tableATax012TaxableAmount1Field = form.getTextField("table_a_tax_012_taxable_amount_1");
    const tableATax012TaxableAmount2Field = form.getTextField("table_a_tax_012_taxable_amount_2");
    const tableATax012TaxableAmount3Field = form.getTextField("table_a_tax_012_taxable_amount_3");
    const tableATax012TaxValueDecimalField = form.getTextField("table_a_tax_012_tax_value_decimal");
    const tableATax012TaxValue1Field = form.getTextField("table_a_tax_012_tax_value_1");
    const tableATax012TaxValue2Field = form.getTextField("table_a_tax_012_tax_value_2");
    const tableATax012TaxValue3Field = form.getTextField("table_a_tax_012_tax_value_3");

    const tableATax035QuantityField = form.getTextField("table_a_tax_035_quantity");
    const tableATax035TaxableAmountDecimalField = form.getTextField("table_a_tax_035_taxable_amount_decimal");
    const tableATax035TaxableAmount1Field = form.getTextField("table_a_tax_035_taxable_amount_1");
    const tableATax035TaxableAmount2Field = form.getTextField("table_a_tax_035_taxable_amount_2");
    const tableATax035TaxableAmount3Field = form.getTextField("table_a_tax_035_taxable_amount_3");
    const tableATax035TaxValueDecimalField = form.getTextField("table_a_tax_035_tax_value_decimal");
    const tableATax035TaxValue1Field = form.getTextField("table_a_tax_035_tax_value_1");
    const tableATax035TaxValue2Field = form.getTextField("table_a_tax_035_tax_value_2");
    const tableATax035TaxValue3Field = form.getTextField("table_a_tax_035_tax_value_3");

    const tableATax132QuantityField = form.getTextField("table_a_tax_132_quantity");
    const tableATax132TaxableAmountDecimalField = form.getTextField("table_a_tax_132_taxable_amount_decimal");
    const tableATax132TaxableAmount1Field = form.getTextField("table_a_tax_132_taxable_amount_1");
    const tableATax132TaxableAmount2Field = form.getTextField("table_a_tax_132_taxable_amount_2");
    const tableATax132TaxableAmount3Field = form.getTextField("table_a_tax_132_taxable_amount_3");
    const tableATax132TaxValueDecimalField = form.getTextField("table_a_tax_132_tax_value_decimal");
    const tableATax132TaxValue1Field = form.getTextField("table_a_tax_132_tax_value_1");
    const tableATax132TaxValue2Field = form.getTextField("table_a_tax_132_tax_value_2");
    const tableATax132TaxValue3Field = form.getTextField("table_a_tax_132_tax_value_3");

    const tableATax132ExtraQuantityField = form.getTextField("table_a_tax_132_extra_quantity");
    const tableATax132ExtraTaxableAmountDecimalField = form.getTextField("table_a_tax_132_extra_taxable_amount_decimal");
    const tableATax132ExtraTaxableAmount1Field = form.getTextField("table_a_tax_132_extra_taxable_amount_1");
    const tableATax132ExtraTaxableAmount2Field = form.getTextField("table_a_tax_132_extra_taxable_amount_2");
    const tableATax132ExtraTaxableAmount3Field = form.getTextField("table_a_tax_132_extra_taxable_amount_3");
    const tableATax132ExtraTaxValueDecimalField = form.getTextField("table_a_tax_132_extra_tax_value_decimal");
    const tableATax132ExtraTaxValue1Field = form.getTextField("table_a_tax_132_extra_tax_value_1");
    const tableATax132ExtraTaxValue2Field = form.getTextField("table_a_tax_132_extra_tax_value_2");
    const tableATax132ExtraTaxValue3Field = form.getTextField("table_a_tax_132_extra_tax_value_3");
    
    const totalTaxValueDecimalField = form.getTextField("total_tax_value_decimal");
    const totalTaxValue1Field = form.getTextField("total_tax_value_1");
    const totalTaxValue2Field = form.getTextField("total_tax_value_2");
    const totalTaxValue3Field = form.getTextField("total_tax_value_3");
    const locationField = form.getTextField("location");
    const dateField = form.getTextField("date");
    
    startMonthField.setText(`${params.start.getDay()}`);
    startYearField.setText(`${params.start.getFullYear()}`);
    endMonthField.setText(`${params.end.getDay()}`);
    endYearField.setText(`${params.end.getFullYear()}`);

    nationalRegistrationNumberField.setText(params.nationalRegistrationNumber);
    
    fullNameField.setText(params.fullName);
    
    addressLine1Field.setText(params.addressLine1);
    addressLine2Field.setText(params.addressLine2);
    addressLine3Field.setText(params.addressLine3);
    
    tableATax012QuantityField.setText(`${params.tableATax012Quantity}`);
    const tableATax012TaxableAmountValues = splitMoneyValueForFormField(params.tableATax012TaxableAmount);
    tableATax012TaxableAmountDecimalField.setText(tableATax012TaxableAmountValues[0]);
    tableATax012TaxableAmount1Field.setText(tableATax012TaxableAmountValues[1]);
    tableATax012TaxableAmount2Field.setText(tableATax012TaxableAmountValues[2]);
    tableATax012TaxableAmount3Field.setText(tableATax012TaxableAmountValues[3]);
    const tableATax012TaxValues = splitMoneyValueForFormField(params.tableATax012TaxValue);
    tableATax012TaxValueDecimalField.setText(tableATax012TaxValues[1]);
    tableATax012TaxValue1Field.setText(tableATax012TaxValues[1]);
    tableATax012TaxValue2Field.setText(tableATax012TaxValues[2]);
    tableATax012TaxValue3Field.setText(tableATax012TaxValues[3]);
    
    tableATax035QuantityField.setText(`${params.tableATax035Quantity}`);
    const tableATax035TaxableAmountValues = splitMoneyValueForFormField(params.tableATax035TaxableAmount);
    tableATax035TaxableAmountDecimalField.setText(tableATax035TaxableAmountValues[0]);
    tableATax035TaxableAmount1Field.setText(tableATax035TaxableAmountValues[1]);
    tableATax035TaxableAmount2Field.setText(tableATax035TaxableAmountValues[2]);
    tableATax035TaxableAmount3Field.setText(tableATax035TaxableAmountValues[3]);
    const tableATax035TaxValues = splitMoneyValueForFormField(params.tableATax035TaxValue);
    tableATax035TaxValueDecimalField.setText(tableATax035TaxValues[1]);
    tableATax035TaxValue1Field.setText(tableATax035TaxValues[1]);
    tableATax035TaxValue2Field.setText(tableATax035TaxValues[2]);
    tableATax035TaxValue3Field.setText(tableATax035TaxValues[3]);
    
    tableATax132QuantityField.setText(`${params.tableATax132Quantity}`);
    const tableATax132TaxableAmountValues = splitMoneyValueForFormField(params.tableATax132TaxableAmount);
    tableATax132TaxableAmountDecimalField.setText(tableATax132TaxableAmountValues[0]);
    tableATax132TaxableAmount1Field.setText(tableATax132TaxableAmountValues[1]);
    tableATax132TaxableAmount2Field.setText(tableATax132TaxableAmountValues[2]);
    tableATax132TaxableAmount3Field.setText(tableATax132TaxableAmountValues[3]);
    const tableATax132TaxValues = splitMoneyValueForFormField(params.tableATax132TaxValue);
    tableATax132TaxValueDecimalField.setText(tableATax132TaxValues[1]);
    tableATax132TaxValue1Field.setText(tableATax132TaxValues[1]);
    tableATax132TaxValue2Field.setText(tableATax132TaxValues[2]);
    tableATax132TaxValue3Field.setText(tableATax132TaxValues[3]);
    
    tableATax132ExtraQuantityField.setText(`${params.tableATax132ExtraQuantity}`);
    const tableATax132ExtraTaxableAmountValues = splitMoneyValueForFormField(params.tableATax132ExtraTaxableAmount);
    tableATax132ExtraTaxableAmountDecimalField.setText(tableATax132ExtraTaxableAmountValues[0]);
    tableATax132ExtraTaxableAmount1Field.setText(tableATax132ExtraTaxableAmountValues[1]);
    tableATax132ExtraTaxableAmount2Field.setText(tableATax132ExtraTaxableAmountValues[2]);
    tableATax132ExtraTaxableAmount3Field.setText(tableATax132ExtraTaxableAmountValues[3]);
    const tableATax132ExtraTaxValues = splitMoneyValueForFormField(params.tableATax132ExtraTaxValue);
    tableATax132ExtraTaxValueDecimalField.setText(tableATax132ExtraTaxValues[1]);
    tableATax132ExtraTaxValue1Field.setText(tableATax132ExtraTaxValues[1]);
    tableATax132ExtraTaxValue2Field.setText(tableATax132ExtraTaxValues[2]);
    tableATax132ExtraTaxValue3Field.setText(tableATax132ExtraTaxValues[3]);

    const totalTaxValues = splitMoneyValueForFormField(params.totalTaxValue);
    totalTaxValueDecimalField.setText(totalTaxValues[0]);
    totalTaxValue1Field.setText(totalTaxValues[1]);
    totalTaxValue2Field.setText(totalTaxValues[2]);
    totalTaxValue3Field.setText(totalTaxValues[3]);

    locationField.setText(params.location);

    dateField.setText(params.date);

    return document.save();
}
