import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { creatorRouter } from "./routes/creator.js";
import { healthRouter } from "./routes/health.js";
import { listingsRouter } from "./routes/listings.js";
import { purchasesRouter } from "./routes/purchases.js";
import { reviewRouter } from "./routes/review.js";
import { usersRouter } from "./routes/users.js";
import { versionRouter } from "./routes/version.js";
import { errorHandler, notFound } from "./http/errors.js";

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: config.publicAppUrl,
    credentials: true
  }));
  app.use(express.json({ limit: "1mb" }));

  app.use(healthRouter);
  app.use(versionRouter);
  app.use("/api", authRouter);
  app.use("/api", usersRouter);
  app.use("/api", listingsRouter);
  app.use("/api", purchasesRouter);
  app.use("/api", creatorRouter);
  app.use("/api", reviewRouter);
  app.use("/api", adminRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
