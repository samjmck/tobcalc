import { Writable, writable } from "svelte/store";
import type { TaxFormData } from "./tobcalc-lib";

type CustomGlobalTaxFormDataMethods = {
    delete: (index: number) => void;
    setTaxFormData: (serviceNumber: number, taxFormData: TaxFormData) => void;
}

function createGlobalTaxFormDataStore(): Writable<Map<number, TaxFormData>> & CustomGlobalTaxFormDataMethods {
    const { subscribe, set, update } = writable<Map<number, TaxFormData>>(new Map());

    return {
        subscribe,
        set,
        update,
        delete: (serviceNumber: number) => {
            update(globalTaxFormData => {
                globalTaxFormData.delete(serviceNumber);
                return globalTaxFormData;
            });
        },
        setTaxFormData: (serviceNumber: number, taxFormData: TaxFormData) => {
            update(globalTaxFormData => {
                globalTaxFormData.set(serviceNumber, taxFormData);
                return globalTaxFormData;
            });
        },
    };
}

export const globalTaxFormData = createGlobalTaxFormDataStore();
export const adapterNumber = writable(0);
