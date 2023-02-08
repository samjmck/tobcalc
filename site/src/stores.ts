import { Writable, writable } from "svelte/store";
import type { TaxFormData } from "./tobcalc-lib";

export interface SessionInfo {
    start: string;
    end: string;
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    signatureName: string;
    signatureCapacity: string;
    signatureDate: string;
    location: string;
    date: string;
}

// localStorage update is blocking and can cause the UI to freeze
// so we delay it
let localStorageUpdateIdsByKey = new Map<string, number>();
function delayedLocalStorageUpdate(key: string, value: string) {
    const id = localStorageUpdateIdsByKey.get(key);
    if(id !== null) {
        clearTimeout(id);
    }
    // @ts-ignore
    const newId: number = setTimeout(() => {
        window.localStorage.setItem(key, value);
    }, 500);
    localStorageUpdateIdsByKey.set(key, newId);
}

function createLastSessionStore(): Writable<SessionInfo> {
    let lastSession: SessionInfo;
    if(window.localStorage.getItem("lastSession") !== null) {
        lastSession = JSON.parse(window.localStorage.getItem("lastSession"));
    } else {
        lastSession = {
            start: "",
            end: "",
            fullName: "",
            addressLine1: "",
            addressLine2: "",
            addressLine3: "",
            signatureName: "",
            signatureCapacity: "",
            signatureDate: "",
            location: "",
            date: "",
        };
    }

    const { subscribe, set, update } = writable<SessionInfo>(lastSession);
    return {
        subscribe,
        set: (value: SessionInfo) => {
            set(value);
            delayedLocalStorageUpdate("lastSession", JSON.stringify(value));
        },
        update,
    };
}

type TotalTaxFormDataMethods = {
    delete: (index: number) => void;
    setTaxFormData: (serviceNumber: number, taxFormData: TaxFormData) => void;
}

function createTotalTaxFormDataStore(): Writable<Map<number, TaxFormData>> & TotalTaxFormDataMethods {
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

type TaxRateOverridesStoreMethods = {
    delete: (isin: string) => void;
    setOverride: (isin: string, taxRate: number) => void;
}

function createTaxRateOverridesStore(): Writable<Map<string, number>> & TaxRateOverridesStoreMethods {
    const taxRateOverridesMap = new Map<string, number>();
    const localStorageOverrides = window.localStorage.getItem("taxRateOverrides");
    if(localStorageOverrides !== null) {
        const overrides = JSON.parse(localStorageOverrides);
        for(const [isin, taxRate] of overrides) {
            taxRateOverridesMap.set(isin, taxRate);
        }
    }

    const { subscribe, set, update } = writable<Map<string, number>>(taxRateOverridesMap);

    return {
        subscribe,
        set,
        update,
        delete: (isin: string) => {
            update(overrides => {
                overrides.delete(isin);
                delayedLocalStorageUpdate("taxRateOverrides", JSON.stringify([...overrides.entries()]));
                return overrides;
            });
        },
        setOverride: (key: string, taxRate: number) => {
            update(overrides => {
                overrides.set(key, taxRate);
                delayedLocalStorageUpdate("taxRateOverrides", JSON.stringify([...overrides.entries()]));
                return overrides;
            });
        },
    };
}

function createSettingStore(localStorageKey: string): Writable<boolean> {
    const { subscribe, set, update } = writable<boolean>(window.localStorage.getItem(localStorageKey) === "true");

    return {
        subscribe,
        set: (value: boolean) => {
            console.log(value);
            set(value);
            window.localStorage.setItem(localStorageKey, value.toString());
        },
        update,
    };
}

export const lastSession = createLastSessionStore();
export const nationalRegistrationNumber = writable("");
export const signatureFiles = writable<File[]>([]);
export const totalTaxFormData = createTotalTaxFormDataStore();
export const taxRateOverrides = createTaxRateOverridesStore();
export const adapterNumber = writable(0);

// Settings
export const openSettings = writable(false);
export const alwaysOpenFilterDialog = createSettingStore("alwaysOpenFilterDialog");
