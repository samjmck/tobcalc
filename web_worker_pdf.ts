import { fillPdf, updatePdfMeta } from "./src/pdf.ts";

declare let onmessage: (event: MessageEvent) => void;
declare function postMessage(message: any): void;

let previousObjectUrl: string;
onmessage = async event => {
    const parameters = <Parameters<typeof fillPdf>> event.data;
    const bytes = await updatePdfMeta(await fillPdf(...parameters));
    const pdfObjectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    if(previousObjectUrl !== undefined) {
        URL.revokeObjectURL(previousObjectUrl);
    }
    previousObjectUrl = pdfObjectUrl;
    postMessage(pdfObjectUrl);
};
