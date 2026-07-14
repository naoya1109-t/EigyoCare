import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const suppliersRouter = Router();
suppliersRouter.use(requireAuth);

const LIST_COLUMNS = `
  s.仕入先CD AS supplierCode,
  s.仕入先名 AS supplierName,
  s.仕入先名カナ AS supplierNameKana,
  p.県名 AS prefecture,
  s.TEL AS tel
`;

const DETAIL_COLUMNS = `
  s.仕入先CD AS supplierCode,
  s.仕入先名 AS supplierName,
  s.仕入先名カナ AS supplierNameKana,
  s.郵便番号 AS zipCode,
  p.県名 AS prefecture,
  s.住所1 AS address1,
  s.住所2 AS address2,
  s.TEL AS tel,
  s.FAX AS fax,
  s.HP AS homepage,
  s.代表者氏名 AS representativeName,
  s.担当者部署 AS contactDept,
  s.担当者役職 AS contactTitle,
  s.担当者名 AS contactName,
  s.担TEL AS contactTel,
  s.Email AS email,
  s.備考 AS remarks
`;

suppliersRouter.get("/suppliers", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("search", sql.NVarChar, `%${search}%`)
    .query(`
      SELECT TOP 200 ${LIST_COLUMNS}
      FROM [10.194.5.55].Medical.dbo.T430仕入先 s
      LEFT JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE s.取引終了 = 2
        AND (s.仕入先名 LIKE @search OR s.仕入先名カナ LIKE @search)
      ORDER BY s.仕入先CD
    `);
  res.json(result.recordset);
});

suppliersRouter.get("/suppliers/:code", async (req, res) => {
  const code = Number(req.params.code);
  if (!Number.isInteger(code)) {
    res.status(400).json({ message: "仕入先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("code", sql.SmallInt, code)
    .query(`
      SELECT ${DETAIL_COLUMNS}
      FROM [10.194.5.55].Medical.dbo.T430仕入先 s
      LEFT JOIN ET0001県 p ON s.県CD = p.県CD
      WHERE s.仕入先CD = @code
    `);
  const row = result.recordset[0];
  if (!row) {
    res.status(404).json({ message: "仕入先が見つかりません" });
    return;
  }
  res.json(row);
});
