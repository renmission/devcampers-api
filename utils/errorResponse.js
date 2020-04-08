class ErrorResponse extends Error {
    constructor(messsage, statusCode) {
        super(messsage);
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;