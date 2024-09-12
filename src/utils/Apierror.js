class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    data = null,  // Added data parameter with default value null
    stack = ""
  ) {
    super(message);  // Call the parent class (Error) constructor with the message
    this.statusCode = statusCode;  // Assign the status code
    this.data = data;  // Store any additional data (default is null)
    this.success = false;  // Indicates failure (for API errors)
    this.errors = errors;  // Store any specific errors as an array

    if (stack) {
      this.stack = stack;  // Use the provided stack trace if available
    } else {
      Error.captureStackTrace(this, this.constructor);  // Otherwise, capture the current stack trace
    }
  }
}

export { ApiError };

