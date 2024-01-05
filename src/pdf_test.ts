import { fillPdf } from "./pdf.ts";
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import { assertEquals } from "https://deno.land/std@0.128.0/testing/asserts.ts";

Deno.test({
    name: "fill pdf",
    permissions: {
        read: true,
    },
    fn: async () => {
        const pdfFile = await Deno.readFile("pdfs/TOB-NL.pdf");
        const params: Parameters<typeof fillPdf>[1] = {
            start: new Date("21 December 2021 00:00:00 GMT"),
            end: new Date("22 January 2022 00:00:00 GMT"),
            nationalRegistrationNumber: "00.00.00-000.00",
            fullName: "John Doe",
            addressLine1: "Celestijnenlaan 200A",
            addressLine2: "3001 Leuven",
            addressLine3: "Belgium",
            tableATax012Quantity: 1,
            tableATax035Quantity: 2,
            tableATax132Quantity: 3,
            tableATax012TaxBase: 100_00,
            tableATax035TaxBase: 200_00,
            tableATax132TaxBase: 300_00,
            tableATax012TaxValue: 1_00,
            tableATax035TaxValue: 2_00,
            tableATax132TaxValue: 3_00,
            tableATotalTaxValue: 5_00,
            totalTaxValue: 5_00,
            signaturePng: await Deno.readFile("src/pdf_test_signature.png"),
            signatureName: "John Doe",
            signatureCapacity: "unknown",
            location: "Leuven",
            date: "23 January 2022",
        }
        const filledPdf = await fillPdf(pdfFile, params);

        const filledDocument = await PDFDocument.load(filledPdf);
        const form = filledDocument.getForm();

        assertEquals(form.getTextField("start_month").getText(), "12");
        assertEquals(form.getTextField("end_month").getText(), "01");
        assertEquals(form.getTextField("start_year").getText(), "2021");
        assertEquals(form.getTextField("end_year").getText(), "2022");

        assertEquals(form.getTextField("national_registration_number").getText(), params.nationalRegistrationNumber);
        assertEquals(form.getTextField("full_name").getText(), params.fullName);

        assertEquals(form.getTextField("address_line_1").getText(), params.addressLine1);
        assertEquals(form.getTextField("address_line_2").getText(), params.addressLine2);
        assertEquals(form.getTextField("address_line_3").getText(), params.addressLine3);

        assertEquals(form.getTextField("table_a_tax_012_quantity").getText(), `${params.tableATax012Quantity}`);
        assertEquals(form.getTextField("table_a_tax_012_tax_base").getText(), "€ 100,00");
        assertEquals(form.getTextField("table_a_tax_012_tax_value").getText(), "€ 1,00");

        assertEquals(form.getTextField("table_a_tax_035_quantity").getText(), `${params.tableATax035Quantity}`);
        assertEquals(form.getTextField("table_a_tax_035_tax_base").getText(), "€ 200,00");
        assertEquals(form.getTextField("table_a_tax_035_tax_value").getText(), "€ 2,00");

        assertEquals(form.getTextField("table_a_tax_132_quantity").getText(), `${params.tableATax132Quantity}`);
        assertEquals(form.getTextField("table_a_tax_132_tax_base").getText(), "€ 300,00");
        assertEquals(form.getTextField("table_a_tax_132_tax_value").getText(), "€ 3,00");

        assertEquals(form.getTextField("table_a_total_tax_value").getText(), "€ 5,00");
        assertEquals(form.getTextField("total_tax_value").getText(), "€ 5,00");

        assertEquals(form.getTextField("location").getText(), params.location);
        assertEquals(form.getTextField("date").getText(), params.date);

        assertEquals(form.getTextField("signer").getText(), `${params.signatureName}  , ${params.signatureCapacity}`);

        // No getImage() method on textField so no way to check signature image

    },
})
