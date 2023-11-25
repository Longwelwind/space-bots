export default class HttpError extends Error {
    httpStatusCode: number;
    errorCode: string;

    constructor(httpCode: number, error: string, message = "") {
        super(message);
        this.name = this.constructor.name;
        this.errorCode = error;
        this.httpStatusCode = httpCode;
    }
}
