import { fillPdf } from "./src/pdf.ts";

declare let onmessage: (event: MessageEvent) => void;
declare function postMessage(message: any): void;

onmessage = async event => {
    const parameters = <Parameters<typeof fillPdf>> event.data;
    postMessage(await fillPdf(...parameters));
};
