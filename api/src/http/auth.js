import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { query } from "../db/pool.js";
import { HttpError } from "./errors.js";

export const signSession = (user) => jwt.sign(
  {
    sub: user.id,
    walletAddress: user.wallet_address
  },
  config.jwtSecret,
  { expiresIn: "7d" }
);

export const requireAuth = (req, _res, next) => {
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next(new HttpError(401, "Missing bearer token"));
    return;
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new HttpError(401, "Invalid bearer token"));
  }
};

export const requireAdmin = async (req, _res, next) => {
  try {
    if (!req.user?.sub) {
      throw new HttpError(401, "Missing session");
    }

    const result = await query("select wallet_address, role from users where id = $1", [req.user.sub]);
    const user = result.rows[0];
    const wallet = user?.wallet_address?.toLowerCase();
    const isAdmin = user?.role === "admin" || config.adminWallets.includes(wallet);
    if (!isAdmin) {
      throw new HttpError(403, "Admin access required");
    }

    next();
  } catch (err) {
    next(err);
  }
};
