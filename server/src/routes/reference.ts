import { Router } from "express";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const referenceRouter = Router();
referenceRouter.use(requireAuth);

referenceRouter.get("/reps", async (_req, res) => {
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .query("SELECT 担当者CD AS repCode, 担当者名 AS repName FROM ET0010担当者 ORDER BY 担当者CD");
  res.json(result.recordset);
});

referenceRouter.get("/prefectures", async (_req, res) => {
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .query("SELECT 県CD AS prefectureCode, 県名 AS prefectureName FROM ET0001県 ORDER BY 県CD");
  res.json(result.recordset);
});
