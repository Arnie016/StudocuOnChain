import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAuth } from "../http/auth.js";
import { HttpError } from "../http/errors.js";
import { verifyPurchaseTransaction } from "../services/chain.js";
import { createDownloadUrl } from "../services/storage.js";

export const purchasesRouter = Router();

purchasesRouter.get("/purchases", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select p.*, l.title, l.school, l.course
       from purchases p
       join listings l on l.id = p.listing_id
       where p.buyer_user_id = $1
       order by p.created_at desc`,
      [req.user.sub]
    );
    res.json({ purchases: result.rows });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post("/purchases/:listingId/intent", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "select id, price_wei from listings where id = $1 and status = 'approved'",
      [req.params.listingId]
    );
    const listing = result.rows[0];
    if (!listing) {
      throw new HttpError(404, "Approved listing not found");
    }

    res.json({
      listingId: listing.id,
      amountWei: listing.price_wei,
      nextAction: "send_transaction_to_marketplace_contract"
    });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.post("/purchases/:listingId/verify", requireAuth, async (req, res, next) => {
  try {
    const input = z.object({ txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) }).parse(req.body);
    const listingResult = await query(
      `select l.*, u.wallet_address as buyer_wallet
       from listings l
       cross join users u
       where l.id = $1 and l.status = 'approved' and u.id = $2`,
      [req.params.listingId, req.user.sub]
    );
    const listing = listingResult.rows[0];
    if (!listing) {
      throw new HttpError(404, "Approved listing not found");
    }

    const verification = await verifyPurchaseTransaction({
      txHash: input.txHash,
      expectedBuyer: listing.buyer_wallet,
      expectedAmountWei: listing.price_wei
    });
    if (!verification.ok) {
      throw new HttpError(400, verification.reason);
    }

    const purchaseResult = await query(
      `insert into purchases (listing_id, buyer_user_id, tx_hash, chain_id, amount_wei, status)
       values ($1, $2, $3, $4, $5, 'confirmed')
       on conflict (tx_hash) do update set status = 'confirmed'
       returning *`,
      [listing.id, req.user.sub, input.txHash, process.env.CHAIN_ID || "11155111", listing.price_wei]
    );

    await query(
      `insert into access_grants (listing_id, user_id, purchase_id)
       values ($1, $2, $3)
       on conflict (listing_id, user_id) do nothing`,
      [listing.id, req.user.sub, purchaseResult.rows[0].id]
    );

    res.json({ purchase: purchaseResult.rows[0], verification });
  } catch (err) {
    next(err);
  }
});

purchasesRouter.get("/access/:listingId/download-url", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select l.file_object_key
       from access_grants ag
       join listings l on l.id = ag.listing_id
       where ag.listing_id = $1 and ag.user_id = $2
         and (ag.expires_at is null or ag.expires_at > now())`,
      [req.params.listingId, req.user.sub]
    );
    const row = result.rows[0];
    if (!row) {
      throw new HttpError(403, "No active access grant");
    }
    const downloadUrl = await createDownloadUrl({ key: row.file_object_key });
    res.json({ downloadUrl, expiresInSeconds: 120 });
  } catch (err) {
    next(err);
  }
});
