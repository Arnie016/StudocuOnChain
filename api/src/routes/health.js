import { Router } from "express";
import { query } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res, next) => {
  try {
    await query("select 1");
    res.json({ ok: true, service: "studocuonchain-api" });
  } catch (err) {
    next(err);
  }
});
