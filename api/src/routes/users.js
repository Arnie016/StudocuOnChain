import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";
import { requireAuth } from "../http/auth.js";

export const usersRouter = Router();

usersRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const input = z.object({
      displayName: z.string().min(1).max(80).optional(),
      avatarUrl: z.string().url().optional()
    }).parse(req.body);

    const result = await query(
      `update users
       set display_name = coalesce($2, display_name),
           avatar_url = coalesce($3, avatar_url),
           updated_at = now()
       where id = $1
       returning *`,
      [req.user.sub, input.displayName, input.avatarUrl]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});
