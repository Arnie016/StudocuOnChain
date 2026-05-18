import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../http/auth.js";
import { HttpError } from "../http/errors.js";

export const adminRouter = Router();

adminRouter.get("/admin/listings/pending", requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const result = await query(
      `select *
       from listings
       where status = 'pending_review'
       order by updated_at asc
       limit 100`
    );
    res.json({ listings: result.rows });
  } catch (err) {
    next(err);
  }
});

adminRouter.post("/admin/listings/:id/moderation", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const input = z.object({
      status: z.enum(["approved", "rejected", "hidden"]),
      reason: z.string().max(1000).optional().default("")
    }).parse(req.body);

    const result = await query(
      `update listings
       set status = $2,
           rejection_reason = case when $2 = 'rejected' then $3 else rejection_reason end,
           approved_at = case when $2 = 'approved' then now() else approved_at end,
           updated_at = now()
       where id = $1
       returning *`,
      [req.params.id, input.status, input.reason]
    );
    if (!result.rows[0]) {
      throw new HttpError(404, "Listing not found");
    }

    await query(
      `insert into moderation_events (listing_id, reviewer_user_id, status, reason)
       values ($1, $2, $3, $4)`,
      [req.params.id, req.user.sub, input.status, input.reason]
    );

    res.json({ listing: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
