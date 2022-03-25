// @deno-types="https://unpkg.com/xlsx/types/index.d.ts"
import * as XLSX from 'https://unpkg.com/xlsx/xlsx.mjs';

const response = await fetch("https://www.fsma.be/sites/default/files/legacy/official_lists_fo.xls");
const body = await response.arrayBuffer();
const workbook = XLSX.read(body);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rangeString = sheet["!ref"];
if(rangeString !== undefined) {
    const range = XLSX.utils.decode_range(rangeString);
    const numberOfRows = range.e.r;
    const values = <[string, string][]> XLSX.utils.sheet_to_json(sheet, {
        range: `W4:X${numberOfRows}`,
        header: 1, // Generates a 2D array with format [[name1, name2], [name1, name2], [name1, name2], ...]
    });
    const names: string[] = [];
    for(const [name1, name2] of values) {
        names.push(name1);
        if(name2 !== name1) {
            names.push(name2);
        }
    }
    console.log(JSON.stringify(names));
} else {
    console.error("Sheet has undefined range");
}
