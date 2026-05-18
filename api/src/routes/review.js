import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAuth } from "../http/auth.js";
import { HttpError } from "../http/errors.js";

export const reviewRouter = Router();

reviewRouter.get("/review/queue", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select ra.*, l.title, l.school, l.course, l.description
       from review_assignments ra
       join listings l on l.id = ra.listing_id
       where ra.reviewer_user_id = $1 and ra.status = 'assigned'
       order by ra.assigned_at asc`,
      [req.user.sub]
    );
    res.json({ assignments: result.rows });
  } catch (err) {
    next(err);
  }
});

reviewRouter.post("/review/:listingId/vote", requireAuth, async (req, res, next) => {
  try {
    const input = z.object({
      vote: z.enum(["approve", "reject"]),
      reason: z.string().max(1000).optional().default("")
    }).parse(req.body);

    const result = await query(
      `update review_assignments
       set status = 'voted', vote = $3, reason = $4, voted_at = now()
       where listing_id = $1 and reviewer_user_id = $2 and status = 'assigned'
       returning *`,
      [req.params.listingId, req.user.sub, input.vote, input.reason]
    );
    if (!result.rows[0]) {
      throw new HttpError(404, "Active review assignment not found");
    }

    res.json({ assignment: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
