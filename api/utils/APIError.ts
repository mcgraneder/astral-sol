///Custom Error class to maintain status
export class APIError extends Error {
  __proto__ = Error;
  status: number;
  reason: any;

  constructor(message: string, reason = null, status = 400) {
    super(message);
    this.status = status;
    this.reason = reason;
    Object.setPrototypeOf(this, APIError.prototype);
  }

  toJson() {
    return { error: this.message, status: this.status, reason: this.reason };
  }
}
