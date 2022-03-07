export class InformativeError<T> extends Error {
    constructor(key: string, public data?: T) {
        super(key);
    }
}
