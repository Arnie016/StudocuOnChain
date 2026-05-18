export class HttpError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const notFound = (_req, _res, next) => {
  next(new HttpError(404, "Not found"));
};

export const errorHandler = (err, _req, res, _next) => {
  if (err?.name === "ZodError") {
    res.status(400).json({ error: "Invalid request body", details: err.errors });
    return;
  }

  const status = err.status || 500;
  const body = {
    error: status === 500 ? "Internal server error" : err.message
  };

  if (err.details && status < 500) {
    body.details = err.details;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(body);
};
