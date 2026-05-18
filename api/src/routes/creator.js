import { Router } from "express";
import { query } from "../db/pool.js";
import { requireAuth } from "../http/auth.js";

export const creatorRouter = Router();

creatorRouter.get("/creator/listings", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select *
       from listings
       where creator_user_id = $1
       order by created_at desc`,
      [req.user.sub]
    );
    res.json({ listings: result.rows });
  } catch (err) {
    next(err);
  }
});

creatorRouter.get("/creator/earnings", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `select
         coalesce(sum(p.amount_wei::numeric), 0)::text as gross_sales_wei,
         count(p.id)::int as sales_count
       from purchases p
       join listings l on l.id = p.listing_id
       where l.creator_user_id = $1 and p.status = 'confirmed'`,
      [req.user.sub]
    );
    res.json({ earnings: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
