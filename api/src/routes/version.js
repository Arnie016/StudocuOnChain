import { Router } from "express";

export const versionRouter = Router();

versionRouter.get("/version", (_req, res) => {
  res.json({
    name: "studocuonchain-api",
    version: "0.1.0"
  });
});
