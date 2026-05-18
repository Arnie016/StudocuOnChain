import crypto from "node:crypto";
import { Router } from "express";
import { SiweMessage } from "siwe";
import { z } from "zod";
import { query } from "../db/pool.js";
import { config } from "../config.js";
import { HttpError } from "../http/errors.js";
import { signSession, requireAuth } from "../http/auth.js";

export const authRouter = Router();

authRouter.post("/auth/nonce", async (req, res, next) => {
  try {
    const walletAddress = String(req.body?.walletAddress || "").toLowerCase();
    if (!/^0x[a-f0-9]{40}$/.test(walletAddress)) {
      throw new HttpError(400, "Invalid wallet address");
    }

    const nonce = crypto.randomBytes(16).toString("hex");
    await query(
      `insert into siwe_nonces (wallet_address, nonce, expires_at)
       values ($1, $2, now() + interval '10 minutes')`,
      [walletAddress, nonce]
    );
    res.json({ nonce, domain: config.siweDomain });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/auth/verify-siwe", async (req, res, next) => {
  try {
    const body = z.object({
      message: z.string(),
      signature: z.string()
    }).parse(req.body);

    const siwe = new SiweMessage(body.message);
    const walletAddress = siwe.address.toLowerCase();
    const nonceResult = await query(
      `select *
       from siwe_nonces
       where wallet_address = $1 and nonce = $2 and consumed_at is null and expires_at > now()
       order by created_at desc
       limit 1`,
      [walletAddress, siwe.nonce]
    );
    const nonceRecord = nonceResult.rows[0];
    if (!nonceRecord) {
      throw new HttpError(400, "Expired or missing nonce");
    }

    const result = await siwe.verify({
      signature: body.signature,
      domain: config.siweDomain,
      nonce: nonceRecord.nonce
    });

    if (!result.success) {
      throw new HttpError(401, "Signature verification failed");
    }

    await query("update siwe_nonces set consumed_at = now() where id = $1", [nonceRecord.id]);

    const userResult = await query(
      `insert into users (wallet_address)
       values ($1)
       on conflict (wallet_address) do update set updated_at = now()
       returning *`,
      [walletAddress]
    );

    const user = userResult.rows[0];
    res.json({ token: signSession(user), user });
  } catch (err) {
    next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query("select * from users where id = $1", [req.user.sub]);
    res.json({ user: result.rows[0] || null });
  } catch (err) {
    next(err);
  }
});
