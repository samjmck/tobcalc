import { CurrencyCode } from "./enums.ts";

// https://eservices.minfin.fgov.be/myminfin-web/pages/fisconet/document/07143c83-8ef9-4d85-a5fd-7564b0393e1b#_Toc513120036

// getServiceTransactions() -> ServiceTransactions[] -> getExchangeRates(), getSecuritiesTypes() -> TaxableTransaction[] -> getTaxFormData()

export interface ServiceTransaction {
    date: Date;
    isin: string;
    currency: CurrencyCode;
    value: number;
}

export interface ServiceAdapter {
    (data: Blob): Promise<ServiceTransaction[]>;
}
