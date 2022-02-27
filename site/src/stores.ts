import { Writable, writable } from "svelte/store";
import type { Service } from "./service";
import { services } from "./service";

type CustomSelectedServiceStoreMethods = {
    remove: (index: number) => void;
    add: (service: Service) => void;
}

function createSelectedServicesStore(): Writable<Service[]> & CustomSelectedServiceStoreMethods {
    const { subscribe, set, update } = writable<Service[]>([
        services[0],
    ]);

    return {
        subscribe,
        set,
        update,
        remove: (index: number) => {
            console.log(`${index}`);
            update(services => {
                services.splice(index, 1);
                console.log(services);
                return services;
            });
        },
        add: (service: Service) => {
            update(services => {
                services.push(service);
                return services;
            });
        },
    }
}

export const selectedServices = createSelectedServicesStore();
export const adapterNumber = writable(0);
export const adapterCount = writable(1);
