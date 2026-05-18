import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAuth } from "../http/auth.js";
import { HttpError } from "../http/errors.js";
import { createUploadUrl } from "../services/storage.js";

export const listingsRouter = Router();

const listingSchema = z.object({
  title: z.string().min(3).max(160),
  school: z.string().max(120).optional().default(""),
  course: z.string().max(120).optional().default(""),
  tags: z.array(z.string().max(40)).max(12).optional().default([]),
  description: z.string().max(4000).optional().default(""),
  priceWei: z.string().regex(/^[0-9]+$/)
});

listingsRouter.get("/listings", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const params = [];
    let where = "where status = 'approved'";
    if (search) {
      params.push(`%${search}%`);
      where += ` and (title ilike $${params.length} or course ilike $${params.length} or school ilike $${params.length})`;
    }

    const result = await query(
      `select id, title, school, course, tags, description, price_wei, preview_object_key, created_at
       from listings
       ${where}
       order by created_at desc
       limit 50`,
      params
    );
    res.json({ listings: result.rows });
  } catch (err) {
    next(err);
  }
});

listingsRouter.post("/listings", requireAuth, async (req, res, next) => {
  try {
    const input = listingSchema.parse(req.body);
    const result = await query(
      `insert into listings (creator_user_id, title, school, course, tags, description, price_wei, status)
       values ($1, $2, $3, $4, $5, $6, $7, 'draft')
       returning *`,
      [req.user.sub, input.title, input.school, input.course, input.tags, input.description, input.priceWei]
    );
    res.status(201).json({ listing: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

listingsRouter.get("/listings/:id", async (req, res, next) => {
  try {
    const result = await query("select * from listings where id = $1", [req.params.id]);
    if (!result.rows[0]) {
      throw new HttpError(404, "Listing not found");
    }
    res.json({ listing: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

listingsRouter.post("/listings/:id/upload-url", requireAuth, async (req, res, next) => {
  try {
    const contentType = String(req.body?.contentType || "application/pdf");
    const result = await query(
      "select * from listings where id = $1 and creator_user_id = $2",
      [req.params.id, req.user.sub]
    );
    const listing = result.rows[0];
    if (!listing) {
      throw new HttpError(404, "Listing not found");
    }

    const key = `listings/${listing.id}/${crypto.randomUUID()}.pdf`;
    await query("update listings set file_object_key = $1, updated_at = now() where id = $2", [key, listing.id]);
    const uploadUrl = await createUploadUrl({ key, contentType });
    res.json({ key, uploadUrl, expiresInSeconds: 300 });
  } catch (err) {
    next(err);
  }
});

listingsRouter.post("/listings/:id/submit-for-review", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      `update listings
       set status = 'pending_review', updated_at = now()
       where id = $1 and creator_user_id = $2 and file_object_key is not null
       returning *`,
      [req.params.id, req.user.sub]
    );
    if (!result.rows[0]) {
      throw new HttpError(400, "Listing must exist, belong to you, and have an uploaded file");
    }
    res.json({ listing: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
