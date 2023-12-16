import { TextAlignment, rgb } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";

const range = (start, stop, step=1) =>  Array.from({ length: (stop - start) / step + 1}, (_, i) => start + (i * step));

// Some common properties for all TOB pdfs
const commonMetadata = {
    author: "tobcalc",
    producer: "tobcalc (tobcalc.com)",
    creator: "tobcalc (tobcalc.com)",
};
const H  = 17;   // Height of a text field (defining the font size)
const Hs = 50;   // Height of the signature field
const Hl = 11.5; // Height of a line of text
const Wm = 20;   // Width of the month text field
const Wy = 32;   // Width of the year text field
const Wi = 225;  // Width of the identification text fields
const Wq = 40;   // Width of the quantity text fields
const Wt = 125;  // Width of the tax text fields
const Wl = 150;  // Width of the location text field
const Wd = 80;   // Width of the date text field
const Ws = 150;  // Width of the signature text fields
const Wn = 300;  // Width of the signer text field
const T = 0.72;  // Thickness of the strikethrough lines
const C = rgb(0.898, 0.133, 0.216); // Color of the strikethrough lines

type CharSubs = Map<string | number, string>;
const xSPACE    = "0003"; // F1/F3 encoded hex value of the space character
const xDOT      = "0011"; // F1/F3 encoded hex value of the dot (.) character
const xELLIPSIS = "00AB"; // F1/F3 encoded hex value of the ellipsis (...) character
const xCOMMA    = "000F"; // F1/F3 encoded hex value of the comma (,) character
const xSLASH    = "0012"; // F1/F3 encoded hex value of the forward slash (/) character
const spaceOffset = 300;  // Estimated width of the space character
function xChar(char) {
    // Get the F1/F3 encoded hex string for a given alphabetic character
    const offset = 0x0024 - "A".charCodeAt(0); // <0024> = A
    return (char.charCodeAt(0) + offset).toString(16).toUpperCase().padStart(4, "0");
}

// Character substitutions used to remove dots and ellipses
const removeDots: CharSubs = new Map([
    [xDOT, ""],      // Remove dot
    [xELLIPSIS, ""], // Remove triple dot
]);

// Character substitutions used to empty the signature and insert sufficient space for the location and date text fields
const emptySignature: CharSubs = new Map([
    ...removeDots,
    ...moveTextAround(xCOMMA, -15200, -9200), // Insert sufficient space around comma
]);

// Character substitutions used to empty the heading and insert sufficient space for the month and year text fields
function emptyHeading(...spaceIds: number[]): CharSubs {
    const removeSpaces = new Map(spaceIds.map(id => [id, ""]));
    return new Map([
        ...removeDots,
        ...removeSpaces, // Remove additional spaces around both forward slashes (such that both dates are centered)
        ...moveTextAround(xSLASH, -2200, -3200), // Insert sufficient space around forward slash
    ]);
}

// Character substitution used to move text before the given char by offset
function moveText(char, offset, charSub: string | undefined=undefined): CharSubs {
    return new Map([
        // Insert a space character, followed by a movement by spaceOffset (reverting the insertion of a space) + offset units,
        // and continue with the given character (or its substitution).
        [char, `><${xSPACE}>${spaceOffset + offset}<${charSub ?? char}`],
    ]);
}

// Character substitution used to move text after the given char by offset
function moveTextAfter(char, offset, charSub: string | undefined=undefined): CharSubs {
    return new Map([
        // Insert the given character (or its substitution), followed by a movement by offset units.
        [char, `><${charSub ?? char}>${offset}<`],
    ]);
}

// Character substitution used to move text around the given char by offsetBefore and offsetAfter
function moveTextAround(char, offsetBefore, offsetAfter, charSub: string | undefined=undefined): CharSubs {
    return new Map([
        // Insert a space character, followed by a movement by spaceOffset (reverting the insertion of a space) + offset units,
        // continue with the given character (or its substitution), followed by a movement by offsetAfter units.
        [char, `><${xSPACE}>${spaceOffset + offsetBefore}<${charSub ?? char}>${offsetAfter}<`],
    ]);
}

// Character substitution used to move a superscript with footnote reference
const moveNote = (offset) => moveText(0, offset, "000B"); // Move after first character and replace it with itself (an open parenthesis)

// Character substitutions used to capitalize alphabetic characters
function capitalize(...words: string[]): CharSubs {
    const chars = new Set<string>();
    const subs = new Map<string, string>();
    // Note that the offset between the UTF-16 lowercase and uppercase alphabetic characters is the same as the offset between the F1 and
    // F3 encoded lowercase and uppercase alphabetic characters (0x0020).
    words.forEach(word => word.toLowerCase().split("").forEach(c => chars.add(c)));
    chars.forEach(c => subs.set(xChar(c), xChar(c.toUpperCase())));
    return subs;
}

interface TextFieldProps {
    x: number;
    y: number;
    width: number;
    height: number;
    alignment?: TextAlignment;
}

function headingFields(Xds, Xde, Yd): Map<string, TextFieldProps> {
    // Xds: X position of the start date text field
    // Xde: X position of the end date text field
    // Yd:  Y position of the start and end date text fields
    return new Map([
        ["start_month", {x: Xds,          y: Yd, width: Wm, height: H, alignment: TextAlignment.Right}],
        ["start_year",  {x: Xds + Wm + 2, y: Yd, width: Wy, height: H}],
        ["end_month",   {x: Xde,          y: Yd, width: Wm, height: H, alignment: TextAlignment.Right}],
        ["end_year",    {x: Xde + Wm + 2, y: Yd, width: Wy, height: H}],
    ]);
}

function identificationFields(Xi, Yi): Map<string, TextFieldProps> {
    // Xi: X position of the identification text fields
    // Yi: Y position of the lowest identification text field
    return new Map([
        ["national_registration_number", {x: Xi, y: Yi + 4 * Hl, width: Wi, height: H}],
        ["full_name",                    {x: Xi, y: Yi + 3 * Hl, width: Wi, height: H}],
        ["address_line_1",               {x: Xi, y: Yi + 2 * Hl, width: Wi, height: H}],
        ["address_line_2",               {x: Xi, y: Yi + Hl,     width: Wi, height: H}],
        ["address_line_3",               {x: Xi, y: Yi,          width: Wi, height: H}],
    ]);
}

function tableFields(t, Xq, Yq, Yt): Map<string, TextFieldProps> {
    // Xq: X position of the quantity text fields
    // Yq: Y position of the lowest quantity text field in the table (tax rate 1.32%)
    // Yt: Y position of the total tax value text field in the table
    const Xb = Xq + Wq + 6; // X position of the tax base text fields
    const Xv = Xb + Wt + 8; // X position of the tax value text fields
    const Y132 = Yq;                  // Y position of the text fields for the 1.32% tax rate
    const Y035 = Y132 + 2 * Hl + 0.5; // Y position of the text fields for the 0.35% tax rate
    const Y012 = Y035 + 2 * Hl + 0.5; // Y position of the text fields for the 0.12% tax rate
    return new Map([
        [`table_${t}_tax_012_quantity`,  {x: Xq, y: Y012, width: Wq, height: H}],
        [`table_${t}_tax_035_quantity`,  {x: Xq, y: Y035, width: Wq, height: H}],
        [`table_${t}_tax_132_quantity`,  {x: Xq, y: Y132, width: Wq, height: H}],
        [`table_${t}_tax_012_tax_base`,  {x: Xb, y: Y012, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_tax_035_tax_base`,  {x: Xb, y: Y035, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_tax_132_tax_base`,  {x: Xb, y: Y132, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_tax_012_tax_value`, {x: Xv, y: Y012, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_tax_035_tax_value`, {x: Xv, y: Y035, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_tax_132_tax_value`, {x: Xv, y: Y132, width: Wt, height: H, alignment: TextAlignment.Right}],
        [`table_${t}_total_tax_value`,   {x: Xv, y: Yt,   width: Wt, height: H, alignment: TextAlignment.Right}],
    ]);
}

function totalField(Xt, Yt): Map<string, TextFieldProps> {
    // Xt: X position of the total tax value text field
    // Yt: Y position of the total tax value text field
    return new Map([
        ["total_tax_value", {x: Xt, y: Yt, width: Wt, height: H, alignment: TextAlignment.Right}],
    ]);
}

function signatureFields(Xl, Yl, Xs, Ys): Map<string, TextFieldProps> {
    // Xl: X position of the location text field
    // Yl: Y position of the location text field
    // Xs: X position of the signature text field
    // Ys: Y position of the signature text field
    const Xd = Xl + Wl + 3;       // X position of the date text field
    const Xn = Xs + Ws + 1;       // X position of the signer text field
    const Yn = Ys + (Hs - H) / 2; // Y position of the signer text field
    return new Map([
        ["location",  {x: Xl, y: Yl, width: Wl, height: H}],
        ["date",      {x: Xd, y: Yl, width: Wd, height: H}],
        ["signature", {x: Xs, y: Ys, width: Ws, height: Hs}],
        ["signer",    {x: Xn, y: Yn, width: Wn, height: H}],
    ]);
}

function identificationStrikethroughs(Xis, Yis, lengths) {
    // Xis: X position of the identification strikethrough lines
    // Yis: Y position of the lowest identification strikethrough line (inst)
    // lengths: Lengths of the strikethrough lines (prof, repr, inst)
    return new Map([
        ["prof", {x: Xis, y: Yis + 2 * Hl, length: lengths[0], thickness: T, color: C}],
        ["repr", {x: Xis, y: Yis + Hl,     length: lengths[1], thickness: T, color: C}],
        ["inst", {x: Xis, y: Yis,          length: lengths[2], thickness: T, color: C}],
    ]);
}

// Define all modifications to the original TD-OB1 pdfs here.
// Note: Text block ids can be visualized and logged to a file using the identifyText function (or passing the --debug flag to the generate script).
//       For the TOB pdfs, the embedded fonts F1 and F3 are used and each character is individually typeset and encoded as a 4-digit hex string
//       between angle brackets, followed by a horizontal offset. E.g. "<0011>-12" denotes a "." (dot) character followed by a movement of 12 units
//       to the right (i.e. the following character will slightly overlap).
//       Other characters of interest are: "<00AB>" (ellipsis), "<0003>" (space), "<0012>" (forward slash), "<000F>" (comma).
// Note: Annotations can be printed to the console using the logAnnotations function.
//       For text field annotations, the `Rect` property is of interest, defining the position and size of the text field.
//       For strikethrough annotations, the `AP` property is of interest, from which following properties can be extracted:
//          * The start point of the strikethrough line is typically set using the `m` (moveto) operator.
//          * The end point of the strikethrough line is typically set using the `l` (lineto) operator.
//          * The line thickness is set using the `w` (setlinewidth) operator.
//          * The line color is set using the `RG` (setrgbcolor) operator.
const modifications = {
    "DE": {
        0: { // First page
            removeText: new Set([
                // Identification
                35, 39, 41, 45, 47,
                // Table (a)
                ...range(64, 81), ...range(85, 102), ...range(106, 123), ...range(129, 145), ...range(152, 158),
                // Table (b)
                ...range(176, 193), ...range(196, 213), ...range(216, 233), ...range(239, 255), ...range(262, 268),
            ]),
            replaceText: new Map([
                // Heading
                [17, new Map([ // Capitalize "Börsengeschäfte"
                    ...capitalize("rsengeschfte"),
                    ["006C", "0062"],                      // Capitalize "ä"
                    ...moveTextAfter("007C", 180, "0067"), // Capitalize "ö" and reduce space after it
                ])],
                [18, emptyHeading(9, 10, 17, 27)], // Character ids of additional spaces around both forward slashes to remove
                [19, moveNote(-3900)], // Move superscript more to the right
                // Identification
                [24, capitalize("b")],
                [25, moveNote(-110)], // Move superscript more to the right
            ]),
            textFields: new Map([
                ...headingFields(258.5, 376, 685),    // X positions and Y position of the start and end date text fields
                ...identificationFields(300, 534),    // (X, Y) position of the lowest identification text field
                ...tableFields("a", 237, 416, 346.5), // (X, Y) position of the lowest (tax rate 1.32%) quantity and Y position
                ...tableFields("b", 237, 227, 157),   //                 of the total tax value text fields in table (a) and (b)
            ]),
            strikethroughs: new Map([
                ...identificationStrikethroughs(
                    305, 610,     // (X, Y) position of the lowest identification strikethrough line (inst)
                    [102, 68, 62] // Lengths of the strikethrough lines (prof, repr, inst)
                ),
            ]),
        },
        1: { // Second page
            removeText: new Set([
                // Table (c)
                ...range(19, 37), ...range(40, 57), ...range(60, 77), ...range(83, 100), ...range(106, 112),
                // Table (d)
                ...range(131, 149), ...range(152, 169), ...range(172, 189), ...range(195, 212), ...range(218, 224),
                // Total
                ...range(229, 241),
            ]),
            replaceText: new Map([
                [253, new Map(emptySignature)], // Signature
            ]),
            textFields: new Map([
                ...totalField(332, 313),              // (X, Y) position of the total tax value text field
                ...signatureFields(84, 180, 69, 130), // (X, Y) positions of the location and signature text fields
            ]),
        },
        meta: { // Metadata
            title: "Erklärung der Steuer auf Börsengeschäfte",
            ...commonMetadata,
        },
    },
    "EN": {
        0: { // First page
            removeText: new Set([
                // Identification
                31, 35, 37, 41, 43,
                // Table (a)
                ...range(66, 83), ...range(87, 104), ...range(108, 125), ...range(135, 151), ...range(157, 163),
                // Table (b)
                ...range(187, 204), ...range(207, 224), ...range(227, 243), ...range(253, 269), ...range(276, 282),
            ]),
            replaceText: new Map([
                // Heading
                [13, new Map([
                    ...moveText(0, 2100, "0027"), // Move heading more to the left
                    ...capitalize("on", "stock", "exchange", "transactions"),
                    ...moveTextAfter(xChar("g"), 190, xChar("G")), // Capitalize "g" and reduce space after it
                ])],
                [14, new Map([
                    ...moveText(0, 2100, "0029"), // Move heading more to the left
                    ...emptyHeading(22, 44), // Character ids of additional spaces around both forward slashes to remove
                ])],
                [15, moveNote(-6100)], // Move superscript more to the right,
                // Identification
                [22, new Map([
                    [2, xChar("R")], // Capitalize first "r"
                ])],
                [23, moveNote(-450)], // Move superscript more to the right
            ]),
            textFields: new Map([
                ...headingFields(255, 395, 719),      // X positions and Y position of the start and end date text fields
                ...identificationFields(300, 603),    // (X, Y) position of the lowest identification text field
                ...tableFields("a", 225, 427.5, 311), // (X, Y) position of the lowest (tax rate 1.32%) quantity and Y position
                ...tableFields("b", 225, 181, 43),    //                 of the total tax value text fields in table (a) and (b)
            ]),
            strikethroughs: new Map([
                ...identificationStrikethroughs(
                    307, 679,      // (X, Y) position of the lowest identification strikethrough line (inst)
                    [123, 119, 79] // Lengths of the strikethrough lines (prof, repr, inst)
                ),
            ]),
        },
        1: { // Second page
            removeText: new Set([
                // Table (c)
                ...range(20, 37), ...range(41, 58), ...range(62, 79), ...range(88, 104), ...range(110, 116),
                // Table (d)
                ...range(139, 156), ...range(160, 177), ...range(181, 198), ...range(207, 223), ...range(229, 235),
                // Total
                ...range(241, 248),
                // Signature replacements
                257, 259, 260
            ]),
            setText: new Map([
                // Move two signature lines up (replacing blank line contents) such that there is more space for the signature
                [254, 255],
                [255, 257],
            ]),
            replaceText: new Map([
                [255, new Map(emptySignature)], // Signature
            ]),
            textFields: new Map([
                ...totalField(332, 354),              // (X, Y) position of the total tax value text field
                ...signatureFields(81, 272, 69, 222), // (X, Y) positions of the location and signature text fields
            ]),
        },
        meta: { // Metadata
            title: "Declaration on the tax on stock-exchange transactions",
            ...commonMetadata,
        },
    },
    "FR": {
        0: { // First page
            removeText: new Set([
                // Identification
                35, 39, 41, 45, 47,
                // Table (a)
                ...range(66, 83), ...range(87, 104), ...range(108, 125), ...range(130, 147), ...range(153, 159),
                // Table (b)
                ...range(178, 195), ...range(198, 215), ...range(218, 235), ...range(240, 257), ...range(263, 269),
            ]),
            replaceText: new Map([
                // Heading
                [18, emptyHeading(12, 13, 20, 31)], // Character ids of additional spaces around both forward slashes to remove
                [19, moveNote(-3900)], // Move superscript more to the right
            ]),
            textFields: new Map([
                ...headingFields(267, 380, 685),      // X positions and Y position of the start and end date text fields
                ...identificationFields(300, 534),    // (X, Y) position of the lowest identification text field
                ...tableFields("a", 225, 427.5, 369), // (X, Y) position of the lowest (tax rate 1.32%) quantity and Y position
                ...tableFields("b", 225, 250, 191),   //                 of the total tax value text fields in table (a) and (b)
            ]),
            strikethroughs: new Map([
                ...identificationStrikethroughs(
                    305, 610,      // (X, Y) position of the lowest identification strikethrough line (inst)
                    [131, 122, 77] // Lengths of the strikethrough lines (prof, repr, inst)
                ),
            ]),
        },
        1: { // Second page
            removeText: new Set([
                // Table (c)
                ...range(21, 38), ...range(42, 59), ...range(63, 80), ...range(85, 102), ...range(110, 116),
                // Table (d)
                ...range(138, 155), ...range(159, 176), ...range(180, 197), ...range(202, 219), ...range(225, 231),
                // Total
                ...range(241, 248),
            ]),
            replaceText: new Map([
                [260, new Map(emptySignature)], // Signature
            ]),
            textFields: new Map([
                ...totalField(333, 446),              // (X, Y) position of the total tax value text field
                ...signatureFields(79, 306, 69, 251), // (X, Y) positions of the location and signature text fields
            ]),
        },
        meta: { // Metadata
            title: "Déclaration de la taxe sur les opérations de bourse",
            ...commonMetadata,
        },
    },
    "NL": {
        0: { // First page
            removeText: new Set([
                // Identification
                36, 39, 40, 42,
                // Table (a)
                ...range(60, 77), ...range(80, 97), ...range(100, 117), ...range(123, 139), ...range(150, 159),
                // Table (b)
                ...range(176, 193), ...range(196, 213), ...range(216, 233), ...range(239, 255), ...range(265, 273),
            ]),
            replaceText: new Map([
                // Heading
                [18, emptyHeading(13, 14, 25, 37)], // Character ids of additional spaces around both forward slashes to remove
                [19, moveNote(200)], // Move superscript more to the left
                // Identification
                [41, new Map(removeDots)],
            ]),
            textFields: new Map([
                ...headingFields(257, 383.5, 685),    // X positions and Y position of the start and end date text fields
                ...identificationFields(300, 534),    // (X, Y) position of the lowest identification text field
                ...tableFields("a", 231, 404.5, 323), // (X, Y) position of the lowest (tax rate 1.32%) quantity and Y position
                ...tableFields("b", 231, 205, 135),   //                 of the total tax value text fields in table (a) and (b)
            ]),
            strikethroughs: new Map([
                ...identificationStrikethroughs(
                    307, 610,      // (X, Y) position of the lowest identification strikethrough line (inst)
                    [128, 162, 52] // Lengths of the strikethrough lines (prof, repr, inst)
                ),
            ]),
        },
        1: { // Second page
            removeText: new Set([
                // Table (c)
                ...range(18, 35), ...range(39, 56), ...range(60, 77), ...range(84, 100), ...range(111, 119),
                // Table (d)
                ...range(138, 155), ...range(159, 176), ...range(180, 197), ...range(204, 220), ...range(231, 239),
                // Total
                ...range(254, 262),
            ]),
            replaceText: new Map([
                [274, new Map(emptySignature)], // Signature
            ]),
            textFields: new Map([
                ...totalField(338, 400.5),            // (X, Y) position of the total tax value text field
                ...signatureFields(84, 260, 69, 205), // (X, Y) positions of the location and signature text fields
            ]),
        },
        meta: { // Metadata
            title: "Aangifte van de taks op de beursverrichtingen",
            ...commonMetadata,
        },
    },
};

export default modifications;
