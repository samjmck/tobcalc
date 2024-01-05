import {
    PDFArray, PDFDict, PDFDocument, PDFFont, PDFName, PDFPage, PDFRawStream,
    PDFRef, PDFString, PDFTextField, CustomFontEmbedder, decodePDFRawStream
} from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit@1.1.1?dts";
import { formatMoney } from "./formatting.ts";

function setFieldText(field: PDFTextField, text: string, font: PDFFont) {
    // The `setText` method marks the text field as dirty, which will replace the font with a default font
    // that is not embedded in the PDF, breaking PDF/A compliance. Hence, we need to call the `updateAppearances`
    // function with the embedded font again.
    field.setText(text);
    field.updateAppearances(font);
}

function removeAnnotation(page: PDFPage, annotRef: PDFRef) {
    const doc = page.doc;
    page.node.removeAnnot(annotRef);
    // Delete annotation and appearance stream objects
    const annot = doc.context.lookup(annotRef, PDFDict);
    const apRef = (annot.get(PDFName.of('AP')) as PDFDict).get(PDFName.of('N')) as PDFRef;
    doc.context.delete(annotRef);
    doc.context.delete(apRef);
}

async function getEmbeddedFont(doc: PDFDocument, fontRef: PDFRef) {
    // This is a hack to get the embedded font from the PDF, as this functionality is not supported by pdf-lib directly.
    // First retrieve and decode the embedded font bytes. These are located in FontDict[DescendantFonts][0][FontDescriptor][FontFile2].
    const fontDict = doc.context.lookup(fontRef, PDFDict);
    const fontCID = doc.context.lookup((fontDict.get(PDFName.of('DescendantFonts')) as PDFArray).get(0) as PDFRef, PDFDict);
    const fontDescr = doc.context.lookup(fontCID.get(PDFName.of('FontDescriptor')) as PDFRef, PDFDict);
    const fontFileStream = doc.context.lookup(fontDescr.get(PDFName.of('FontFile2')) as PDFRef) as PDFRawStream;
    const fontBytes = decodePDFRawStream(fontFileStream).decode();
    // Now create a CustomFontEmbedder and PDFFont object directly from the font bytes, such that it is not reembedded.
    const embedder = await CustomFontEmbedder.for(fontkit, fontBytes);
    return PDFFont.of(fontRef, doc, embedder);
}

// Given a PDF file that has the text fields we expect in a TOB pdf
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
    const tobRefs = document.catalog.lookup(PDFName.of('TobRefs'), PDFDict);
    const moneyCur = "€";
    const moneySep = {decimal: ",", thousand: "|"};

    // Get embedded font
    const font = await getEmbeddedFont(document, tobRefs.get(PDFName.of("Font")) as PDFRef);

    const startMonthField = form.getTextField("start_month");
    const endMonthField = form.getTextField("end_month");
    const startYearField = form.getTextField("start_year");
    const endYearField = form.getTextField("end_year");

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
    const signerField = form.getTextField("signer");

    setFieldText(startMonthField, `${params.start.getMonth() + 1}`.padStart(2, '0'), font);
    setFieldText(startYearField, `${params.start.getFullYear()}`, font);
    setFieldText(endMonthField, `${params.end.getMonth() + 1}`.padStart(2, '0'), font);
    setFieldText(endYearField, `${params.end.getFullYear()}`, font);

    setFieldText(nationalRegistrationNumberField, params.nationalRegistrationNumber, font);

    setFieldText(fullNameField, params.fullName, font);

    setFieldText(addressLine1Field, params.addressLine1, font);
    setFieldText(addressLine2Field, params.addressLine2, font);
    setFieldText(addressLine3Field, params.addressLine3, font);

    setFieldText(tableATax012QuantityField, `${params.tableATax012Quantity}`, font);
    setFieldText(tableATax012TaxBaseField, formatMoney(params.tableATax012TaxBase, moneyCur, moneySep), font);
    setFieldText(tableATax012TaxValueField, formatMoney(params.tableATax012TaxValue, moneyCur, moneySep), font);

    setFieldText(tableATax035QuantityField, `${params.tableATax035Quantity}`, font);
    setFieldText(tableATax035TaxBaseField, formatMoney(params.tableATax035TaxBase, moneyCur, moneySep), font);
    setFieldText(tableATax035TaxValueField, formatMoney(params.tableATax035TaxValue, moneyCur, moneySep), font);

    setFieldText(tableATax132QuantityField, `${params.tableATax132Quantity}`, font);
    setFieldText(tableATax132TaxBaseField, formatMoney(params.tableATax132TaxBase, moneyCur, moneySep), font);
    setFieldText(tableATax132TaxValueField, formatMoney(params.tableATax132TaxValue, moneyCur, moneySep), font);

    setFieldText(tableATotalTaxValue, formatMoney(params.tableATotalTaxValue, moneyCur, moneySep), font);
    setFieldText(totalTaxValue, formatMoney(params.totalTaxValue, moneyCur, moneySep), font);
    setFieldText(locationField, params.location, font);
    setFieldText(dateField, params.date, font);

    if(params.signaturePng) {
        signatureField.setImage(await document.embedPng(params.signaturePng));
    }
    let signer = params.signatureName;
    if (params.signatureCapacity.length > 0) {
        signer += `  , ${params.signatureCapacity}`;
    }
    setFieldText(signerField, signer, font);

    // Remove appropriate strikethrough annotation
    const identification = "inst";
    const strikethroughRef = (tobRefs.get(PDFName.of("Strikethrough")) as PDFDict).get(PDFName.of(identification)) as PDFRef;
    removeAnnotation(document.getPages()[0], strikethroughRef);

    return document.save();
}

// Given a (filled) TOB PDF file, this will return the bytes of that PDF with updated metadata.
export async function updatePdfMeta(pdfFile: Uint8Array): Promise<Uint8Array> {
    const document = await PDFDocument.load(pdfFile);
    const date = new Date();
    const title = document.getTitle();
    const author = document.getAuthor();
    const producer = document.getProducer();
    const creator = document.getCreator();
    document.setCreationDate(date);
    document.setModificationDate(date);

    // For PDF/A compliance, see https://github.com/Hopding/pdf-lib/issues/230#issuecomment-570072624
    // and https://github.com/Hopding/pdf-lib/issues/1183#issuecomment-1685078941
    // Set unique document ID
    const id = crypto.randomUUID().replace('-', '');
    document.context.trailerInfo.ID = document.context.obj([PDFString.of(id), PDFString.of(id)]);

    // Set xml metadata
    const formattedDate = date.toISOString().split('.')[0] + 'Z';
    const xml = `
        <?xpacket begin="" id="${id}"?>
            <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="${creator}">
                <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
                    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
                        <dc:format>application/pdf</dc:format>
                        <dc:creator>
                            <rdf:Seq>
                                <rdf:li>${author}</rdf:li>
                            </rdf:Seq>
                        </dc:creator>
                        <dc:title>
                            <rdf:Alt>
                                <rdf:li xml:lang="x-default">${title}</rdf:li>
                            </rdf:Alt>
                        </dc:title>
                    </rdf:Description>
                    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
                        <xmp:CreatorTool>${creator}</xmp:CreatorTool>
                        <xmp:CreateDate>${formattedDate}</xmp:CreateDate>
                        <xmp:ModifyDate>${formattedDate}</xmp:ModifyDate>
                        <xmp:MetadataDate>${formattedDate}</xmp:MetadataDate>
                    </rdf:Description>
                    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
                        <pdf:Producer>${producer}</pdf:Producer>
                        <pdf:PDFVersion>1.7</pdf:PDFVersion>
                    </rdf:Description>
                    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">
                        <pdfaid:part>3</pdfaid:part>
                        <pdfaid:conformance>B</pdfaid:conformance>
                    </rdf:Description>
                </rdf:RDF>
            </x:xmpmeta>
        <?xpacket end="w"?>
    `.trim();
    const metaStream = document.context.stream(xml, {
        Type: 'Metadata',
        Subtype: 'XML',
    });
    let metaStreamRef = document.catalog.get(PDFName.of('Metadata'));
    if (metaStreamRef) {
        document.context.delete(metaStreamRef as PDFRef);
    }
    metaStreamRef = document.context.register(metaStream);
    document.catalog.set(PDFName.of('Metadata'), metaStreamRef);

    return document.save();
}
