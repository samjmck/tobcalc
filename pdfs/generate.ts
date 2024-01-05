import { parse } from "https://deno.land/std@0.207.0/flags/mod.ts";
import {
    PDFDocument, PDFDict, PDFName, PDFRef, PDFRawStream, PDFStream, PDFString,
    arrayAsString, decodePDFRawStream, drawLine, rgb
} from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import fontkit from "https://cdn.skypack.dev/@pdf-lib/fontkit@1.1.1?dts";
import modifications from "./pdf_modifications.ts";
import { fillPdf, updatePdfMeta } from "../src/pdf.ts";


const assetsPath = "assets/";
const buildPath = "build/";
const outPath = "";
const languages = ["DE", "EN", "FR", "NL"];

const flags = parseArgs();
await main();


function parseArgs() {
    // Possible arguments to this script:
    //  * --fetch: fetch assets (TOB files, font and color profile) from the internet
    //  * --debug: log additional information for debugging purposes
    //  * --lang: comma separated list of languages to generate TOB forms for (default: all languages)
    const flags = parse(Deno.args, {
        boolean: ["fetch", "debug"],
        string: ["lang"],
    });
    flags.lang = flags.lang?.split(",") ?? languages;
    flags.lang = flags.lang.map(l => l.toUpperCase()).filter(l => languages.includes(l));
    return flags
}

async function main() {
    if (flags.fetch) {
        await Deno.mkdir(assetsPath, {recursive: true});
        await fetchAssets();
    }

    await Deno.mkdir(buildPath, {recursive: true});
    for (const lang of flags.lang) {
        await generate(lang);
    }
}

function logger(file: string | null=null) {
    // Returns a log function that either writes to a file or to the console.
    if (file) {
        Deno.writeTextFileSync(file, "");
        return (line) => Deno.writeTextFileSync(file, line + "\n", {append: true});
    } else {
        return (line) => console.log(line);
    }
}

function replaceSuffix(path, suf) {
    return path.slice(0, path.lastIndexOf(".")) + suf;
}

async function fetchAssets() {
    let response;

    // TOB pdf files
    const tobUrls = {
        "DE": [
            "https://finanzen.belgium.be/sites/default/files/TD-OB1-DE.pdf",
            "https://finanzen.belgium.be/de/sachverständige-und-partner/anleger/steuer-auf-börsengeschäfte#q4"
        ],
        "EN": [
            "https://finance.belgium.be/sites/default/files/Changement de compte formulaire TOB EN.pdf",
            "https://finance.belgium.be/en/experts-partners/investors/tax-stock-exchange-transactions#q4"
        ],
        "FR": [
            "https://finances.belgium.be/sites/default/files/TD-OB1-FR.pdf",
            "https://finances.belgium.be/fr/experts_partenaires/investisseurs/taxe-sur-les-opérations-de-bourse#q4"
        ],
        "NL": [
            "https://financien.belgium.be/sites/default/files/TD-OB1-NL.pdf",
            "https://financien.belgium.be/nl/experten_partners/investeerders/taks-op-beursverrichtingen#q4"
        ],
    };
    for (const [lang, [resUrl, helpUrl]] of Object.entries(tobUrls)) {
        response = await fetch(resUrl);
        if (!response.ok) {
            throw new Error(`Failed to load TOB ${lang} pdf, check ${helpUrl} to see whether the URL changed.`);
        }
        Deno.writeFile(`${assetsPath}TD-OB1-${lang}.pdf`, new Uint8Array(await response.arrayBuffer()));
    }

    // Helvetica font, required for PDF/A compliance
    // Below repository contains a preprocessed version of the font, based on the FreeSans font from GNU FreeFont (https://www.gnu.org/software/freefont/)
    // As pfb files are not supported by fontkit, this file needs to be manually converted to a ttf file.
    response = await fetch("https://github.com/tecnickcom/tc-font-pdfa/raw/main/pfb/PDFAHelvetica.pfb");
    if (!response.ok) {
        throw new Error("Failed to load Helvetica font, check https://github.com/tecnickcom/tc-font-pdfa to see whether the URL changed.");
    }
    Deno.writeFile(`${assetsPath}PDFAHelvetica.pfb`, new Uint8Array(await response.arrayBuffer()));

    // sRGB color profile, required for PDF/A compliance
    response = await fetch("https://www.color.org/profiles/sRGB2014.icc");
    if (!response.ok) {
        throw new Error("Failed to load sRGB color profile, check https://www.color.org/srgbprofiles.xalter to see whether the URL changed.");
    }
    Deno.writeFile(`${assetsPath}sRGB2014.icc`, new Uint8Array(await response.arrayBuffer()));
}

async function logContents(fileName, logName) {
    // Write the contents of each page of the given pdf to a text file.
    const pdfFile = await Deno.readFile(fileName);
    const pdfDoc = await PDFDocument.load(pdfFile);
    const log = logger(logName);

    for (const [p, pdfPage] of pdfDoc.getPages().entries()) {
        log(`----- Page ${p+1}/${pdfDoc.getPages().length} -----`);
        log(extractContents(pdfPage));
    }
}

async function logAnnotations(fileName, subtypeFilter: Array<PDFName> | null=null) {
    // Write the annotations of each page of the given pdf to the console.
    // Annotations can be filtered based on their subtype.
    const pdfFile = await Deno.readFile(fileName);
    const pdfDoc = await PDFDocument.load(pdfFile);
    const log = logger();

    for (const [p, pdfPage] of pdfDoc.getPages().entries()) {
        log(`----- Page ${p+1}/${pdfDoc.getPages().length} -----`);
        const annots = pdfPage.node.Annots();
        for (let a = 0; a < annots?.size(); a++) {
            const ref = annots.get(a) as PDFRef;
            const dict = pdfDoc.context.lookup(ref, PDFDict);
            if (!subtypeFilter || subtypeFilter.some(st => st.toString() == dict.get(PDFName.of("Subtype")).toString())) {
                log(`--- Annotation ${a+1}/${annots.size()} ---`);
                log(ref.tag);
                log(dict.toString());
                if (dict.has(PDFName.of("AP"))) {
                    // If the annotation has an appearance stream, also log it
                    log("AP Stream:");
                    const apStreamRef = dict.get(PDFName.of("AP")).get(PDFName.of("N"));
                    const apStream = pdfDoc.context.lookup(apStreamRef, PDFStream) as PDFRawStream;
                    log(apStream.toString());
                    log(arrayAsString(decodePDFRawStream(apStream).decode()));
                }
            }
        }
    }
}

function extractContents(pdfPage) {
    const pdfDoc = pdfPage.doc;

    // Extract a content stream
    const extractContent = (stream) => {
        if (stream instanceof PDFRawStream) {
            // If the content stream is encoded, decode it
            return arrayAsString(decodePDFRawStream(stream).decode());
        } else {
            return stream.contents;
        }
    };
    // Iterate over the content streams of this page and concatenate them
    const contents = pdfPage.node.Contents();
    let extracted = "";
    if (contents instanceof PDFStream) {
        extracted = extractContent(contents);
    } else {
        for (let c = 0; c < contents.size(); c++) {
            const ref = contents.get(c) as PDFRef;
            const stream = pdfDoc.context.lookup(ref, PDFStream);
            extracted += extractContent(stream);
        }
    }
    return extracted;
}

function setContent(pdfPage, content) {
    const pdfDoc = pdfPage.doc;
    // First remove existing content streams
    const contents = pdfPage.node.Contents();
    if (contents instanceof PDFStream) {
        pdfDoc.context.delete(contents);
    } else {
        for (let c = 0; c < contents.size(); c++) {
            pdfDoc.context.delete(contents.get(c));
        }
    }
    // Then add new content stream
    const stream = pdfDoc.context.flateStream(content);
    const streamRef = pdfDoc.context.register(stream);
    pdfPage.node.set(PDFName.Contents, streamRef);
}

function extractText(pdfPage) {
    const pattern = /BT(.*?)ET/gs;// Text blocks are delimited by BT and ET operators
    const content = extractContents(pdfPage);
    return content.match(pattern) ?? [];
}

function modifyText(pdfPage, modifier) {
    const pattern = /BT(.*?)ET/gs;// Text blocks are delimited by BT and ET operators
    const content = extractContents(pdfPage);
    let m = 0;
    const modifiedContent = content.replace(pattern, (_match, textBlock) => {
        // Call the modifier function on every text block
        const modifiedBlock = modifier(textBlock, m++).trim();
        if (modifiedBlock != '') {
            // Return the modified text block
            return `BT\n${modifiedBlock}\nET`;
        } else {
            // Remove the text block
            return '';
        }
    });
    // Update the page's content
    setContent(pdfPage, modifiedContent);
}

async function identifyText(inputFileName, outputFileName) {
    // Identify the different text blocks in the PDF and write them to a text file.
    // The most important text operators are:
    //  * Tf: set font and size
    //  * Tm: set text matrix (typically used to set text position)
    //  * Td: set text position
    //  * Tj: show text
    //  * TJ: show text, allowing individual glyph positioning
    // Text is either encoded as a hex string (between angle brackets) or as a string of characters (between parentheses).
    const pdfFile = await Deno.readFile(inputFileName);
    const pdfDoc = await PDFDocument.load(pdfFile);
    const font = await embedDefaultFont(pdfDoc);
    const log = logger(replaceSuffix(outputFileName, ".txt"));

    for (const [p, pdfPage] of pdfDoc.getPages().entries()) {
        // Log the identified text blocks and add an identifier text
        log(`----- Page ${p+1}/${pdfDoc.getPages().length} -----`);
        // Add identifier to each text block
        modifyText(pdfPage, (textBlock, i) => {
            log(`[${i}] ${textBlock}`);
            return textBlock + [
                'q', // pushGraphicsState
                `/${font.name} 6 Tf`, // Set font and size
                '1 0 0 rg', // Set fill color (red)
                `([${i}]) Tj`, // Show identifier text
                'Q' // popGraphicState
            ].join("\n");
        });
    }
    const pdfBytes = await pdfDoc.save();
    await Deno.writeFile(outputFileName, pdfBytes);
}

function addAnnotation(pdfPage, annotObj) {
    const pdfDoc = pdfPage.doc;
    const annot = pdfDoc.context.obj(annotObj);
    const annotRef = pdfDoc.context.register(annot);
    pdfPage.node.addAnnot(annotRef);
    return annotRef;
}

function addStrikethroughAnnotation(pdfPage, x, y, length, thickness = 1, color = rgb(0, 0, 0)) {
    // Create horizontal strikethrough annotation
    const pdfDoc = pdfPage.doc;
    const start = {x, y};
    const end = {x: x + length, y};

    // First calculate the bounding box for this annotation and the quadpoints
    // Values of coefficients are empirically determined based on tests with Adobe Reader.
    const BBox = [
        start.x -  4.771*thickness,
        start.y -  7.857*thickness,
        end.x   +  4.771*thickness,
        end.y   + 10.143*thickness
    ];
    const QuadPoints = [
        start.x, BBox[3] - thickness,
        end.x,   BBox[3] - thickness,
        start.x, BBox[1] + thickness,
        end.x,   BBox[1] + thickness
    ];

    // Create the Appearance Stream and add the Annotation
    const apStream = pdfDoc.context.formXObject(
        drawLine({start, end, thickness, color}), {
        FormType: 1,
        BBox,
        Matrix: [1, 0, 0, 1, -BBox[0], -BBox[1]]
    });
    const apStreamRef = pdfDoc.context.register(apStream);
    return addAnnotation(pdfPage, {
        Type: 'Annot',
        Subtype: 'StrikeOut',
        Rect: BBox,
        QuadPoints,
        P: pdfPage.ref,
        F: 4, // Required for PDF/A compliance
        C: [color.red, color.green, color.blue],
        AP: {
            N: apStreamRef // Required for PDF/A compliance
        }
    });
}

async function embedDefaultFont(pdfDoc) {
    // For PDF/A compliance, we need to embed the standard Helvetica font
    const fontBytes = await Deno.readFile(`${assetsPath}PDFAHelvetica.ttf`);
    pdfDoc.registerFontkit(fontkit);
    const font = await pdfDoc.embedFont(fontBytes);
    return font;
}

async function emptyForm(pdfDoc, lang) {
    // Modify text on each page as specified in the modifications object
    const textPattern = /\[.*?\] TJ/g;// Matches a piece of text shown using the TJ operator
    const hexPattern = /<((?:[\dA-F]{4})+)>(-?[\d\.]+)?/g;// Matches a hex string (multiple of 4 numbers) between angle brackets, followed by an optional position
    const emptyPattern = /<>(?:-?[\d\.]+)?/g;// Matches an empty hex string, followed by an optional position
    const charPattern = /[\dA-F]{4}/g;// Matches groups of 4 hex numbers, corresponding to a single character
    for (const [p, pdfPage] of pdfDoc.getPages().entries()) {
        const mods = modifications[lang][p]; // Retrieve the necessary modifications for this page
        const blocks = extractText(pdfPage); // Retrieve all textblocks on this page
        const texts = blocks.map(block => block.match(textPattern)?.at(-1).slice(1, -4) ?? ''); // And extract the last text shown in each block
        if (mods?.removeText || mods?.setText || mods?.replaceText) {
            modifyText(pdfPage, (textBlock, i) => {
                let modifiedBlock = textBlock;
                if (mods.removeText?.has(i)) {
                    // Remove this text block
                    modifiedBlock = '';
                }
                if (mods.setText?.has(i)) {
                    // Set custom text for this text block
                    modifiedBlock = modifiedBlock.replace(textPattern, '').trim(); // Remove all existing text from this block
                    const t = mods.setText.get(i);
                    // Set the new text for this block, either the text is given directly or an id of another textblock is given
                    const newText = (Number.isInteger(t) ? texts[t] : t) ?? '';
                    if (newText == '') {
                        modifiedBlock = ''; // Remove this text block if there is no custom text set
                    } else {
                        modifiedBlock = `${modifiedBlock}\n[${newText}] TJ`; // Add the new text to this block
                    }
                }
                if (mods.replaceText?.has(i)) {
                    // Replace characters in this text block
                    const subs = mods.replaceText.get(i);
                    let c = 0;// Keep track of character count
                    modifiedBlock = modifiedBlock.replace(hexPattern, (_match, hex, pos) => {
                        // First identify all encoded hex strings
                        const modifiedHex = hex.replace(charPattern, char => {
                            // Then replace the necessary characters in each hex string
                            return subs.get(c++) ?? subs.get(char) ?? char;
                        });
                        // Return the modified hex string after removing all empty hex strings from it
                        // (either the whole hex string is empty, or extra empty hex strings were added after the replacements)
                        return `<${modifiedHex}>${pos ?? ''}`.replace(emptyPattern, '');
                    });
                }
                return modifiedBlock;
            });
        }
    }
    return pdfDoc;
}

async function createForm(pdfDoc, lang) {
    // Create form fields and strikethrough annotations as specified in the modifications object
    const form = pdfDoc.getForm();
    const font = await embedDefaultFont(pdfDoc);
    const tobRefs = {
        Font: font.ref,
        Strikethrough: {},
    };

    for (const [p, pdfPage] of pdfDoc.getPages().entries()) {
        const mods = modifications[lang][p]; // Retrieve the necessary modifications for this page
        // Create text fields
        mods?.textFields?.forEach((props, name) => {
            const field = form.createTextField(name);
            if (props.alignment) {
                field.setAlignment(props.alignment);
            }
            field.defaultUpdateAppearances(font);
            field.addToPage(pdfPage, {...props, backgroundColor: undefined, borderColor: undefined, borderWidth: 0, font});
        });
        // Create strikethrough annotations
        mods?.strikethroughs?.forEach((props, name) => {
            const ref = addStrikethroughAnnotation(pdfPage, props.x, props.y, props.length, props.thickness, props.color);
            tobRefs.Strikethrough[name] = ref;
        });
    }
    // Store references to the font and strikethrough annotations in the catalog, such that they can be easily retrieved when the pdf is filled.
    const tobRefsRef = pdfDoc.context.register(pdfDoc.context.obj(tobRefs));
    pdfDoc.catalog.set(PDFName.of('TobRefs'), tobRefsRef);
    return pdfDoc;
}

async function makePdfa(pdfDoc, lang) {
    // Ensure that the document is PDF/A compliant
    // Following https://github.com/Hopding/pdf-lib/issues/230#issuecomment-570072624
    // and https://github.com/Hopding/pdf-lib/issues/1183#issuecomment-1685078941
    const meta = modifications[lang].meta; // Retrieve the metadata

    // Set Output Intent
    const colorProfile = await Deno.readFile(`${assetsPath}sRGB2014.icc`);
    const colorProfileStream = pdfDoc.context.stream(colorProfile, {N: 3});
    const colorProfileStreamRef = pdfDoc.context.register(colorProfileStream);
    const outputIntent = pdfDoc.context.obj({
        Type: 'OutputIntent',
        S: 'GTS_PDFA1',
        OutputConditionIdentifier: PDFString.of('sRGB IEC61966-2.1'),
        RegistryName: PDFString.of('https://www.color.org'),
        DestOutputProfile: colorProfileStreamRef,
    });
    const outputIntentRef = pdfDoc.context.register(outputIntent);
    pdfDoc.catalog.set(PDFName.of('OutputIntents'), pdfDoc.context.obj([outputIntentRef]));

    // Set metadata
    pdfDoc.setTitle(meta.title);
    pdfDoc.setAuthor(meta.author);
    pdfDoc.setProducer(meta.producer);
    pdfDoc.setCreator(meta.creator);
    // Document ID and xml metadata are set by this function
    const pdfBytes = await updatePdfMeta(await pdfDoc.save());
    return await PDFDocument.load(pdfBytes);
}

async function generate(lang) {
    // Generate a fillable and PDF/A compliant TOB form for the given language
    const name = `TD-OB1-${lang}`;
    const pdfFile = await Deno.readFile(`${assetsPath}${name}.pdf`);
    let pdfDoc = await PDFDocument.load(pdfFile);
    let pdfBytes;

    if (flags.debug) { // For debugging purposes
        // Check this file and the console output to identify the text blocks that need to be removed or modified.
        await identifyText(`${assetsPath}${name}.pdf`, `${buildPath}${name}-ids.pdf`);
        // Log contents and annotations of manually modified pdf file (e.g. created by Adobe Acrobat)
        // await logContents(`${buildPath}${name}-modified.pdf`, `${buildPath}${name}-contents.txt`);
        // await logAnnotations(`${buildPath}${name}-modified.pdf`), [PDFName.of("StrikeOut")]);
    }

    // Step 1: Empty the form
    pdfDoc = await emptyForm(pdfDoc, lang);
    pdfBytes = await pdfDoc.save();
    await Deno.writeFile(`${buildPath}${name}-empty.pdf`, pdfBytes);

    if (flags.debug) {
        // await identifyText(`${buildPath}${name}-empty.pdf`, `${buildPath}${name}-empty-ids.pdf`);
    }

    // Step 2: Add form fields
    pdfDoc = await createForm(pdfDoc, lang);
    pdfBytes = await pdfDoc.save();
    await Deno.writeFile(`${buildPath}${name}-empty-fillable.pdf`, pdfBytes);

    if (flags.debug) {
        // await logAnnotations(`${buildPath}${name}-empty-fillable.pdf`);
    }

    // Step 3: Make PDF/A compliant
    pdfDoc = await makePdfa(pdfDoc, lang);
    pdfBytes = await pdfDoc.save();
    await Deno.writeFile(`${buildPath}${name}-empty-fillable-pdfa.pdf`, pdfBytes);

    // Write to output directories
    await Deno.writeFile(`${outPath}TOB-${lang}.pdf`, pdfBytes);
    await Deno.writeFile(`../site/public/TOB-${lang}.pdf`, pdfBytes);

    // Step 4: Fill the form (for debugging purposes)
    if (flags.debug) {
        pdfBytes = await fillPdf(pdfBytes, {
            start: new Date(2024, 1, 1),
            end: new Date(2024, 2, 31),
            nationalRegistrationNumber: "01.23.45-678.90",
            fullName: "John Doe",
            addressLine1: "Celestijnenlaan 200A",
            addressLine2: "3001 Leuven",
            addressLine3: "Belgium",
            tableATax012Quantity: 100,
            tableATax035Quantity: 10,
            tableATax132Quantity: 1,
            tableATax012TaxBase: 1000_00,
            tableATax035TaxBase: 1000_00,
            tableATax132TaxBase: 1000_00,
            tableATax012TaxValue: 1_20,
            tableATax035TaxValue: 3_50,
            tableATax132TaxValue: 13_20,
            tableATotalTaxValue: 17_90,
            totalTaxValue: 17_90,
            signaturePng: await Deno.readFile("../src/pdf_test_signature.png"),
            signatureName: "John Doe",
            signatureCapacity: "Taxpayer",
            location: "Leuven",
            date: "01/03/2024",
        });
        pdfBytes = await updatePdfMeta(pdfBytes);
        await Deno.writeFile(`${buildPath}${name}-filled.pdf`, pdfBytes);
        // await logAnnotations(`${buildPath}${name}-filled.pdf`);
    }
}
