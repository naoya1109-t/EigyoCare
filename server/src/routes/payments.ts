import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

// 前回請求締日を起点に、回収サイクル（月数）後の回収日（31=末日）を支払期日として算出する
function computeDueDate(closingDate: Date | null, cycle: number | null, day: number | null): Date | null {
  if (!closingDate || cycle === null || day === null) return null;
  const target = new Date(Date.UTC(closingDate.getUTCFullYear(), closingDate.getUTCMonth() + cycle, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const targetDay = day >= 31 ? lastDay : Math.min(day, lastDay);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), targetDay));
}

// 「前回請求」は前回の請求締めで確定した金額で、支払期日までに全額入金されている前提。
// 支払期日を過ぎてもなお請求後入金が前回請求に届いていない得意先を「未入金（期限切れ）」として検出する。
// 今回請求はまだ締まっていない進行中の金額のため対象外（詳細は functional-design.md 参照）。
//
// 注意: 「前回入金」は前回請求に対する入金ではなく、実際には1サイクル前（前々回請求）の入金額と一致する
// （締めタイミングのずれによるラグ）。直近請求に対する実入金は「請求後入金」列を使う必要がある。
// 実データで確認（得意先CD:48180 宇野紙株式会社: 前回請求69999円に対し前回入金は29023円だが、
// 請求後入金は69999円で全額入金済み。前回入金は前々回請求29023円と一致していた）。
paymentsRouter.get("/payments", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const showAll = req.query.all === "true";
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;
  const pool = await getReadonlyPool();
  const request = pool.request().input("search", sql.NVarChar, `%${search}%`);
  if (repCode !== undefined) request.input("repCode", sql.SmallInt, repCode);
  const result = await request.query(`
      SELECT
        p.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        r.担当者名 AS repName,
        p.回収サイクル AS collectionCycle,
        p.回収日 AS collectionDay,
        p.前回請求締日 AS previousClosingDate,
        p.前回請求 AS previousInvoice,
        p.請求後入金 AS afterInvoicePayment
      FROM ET0160入金確認 p
      JOIN ET0020得意先 c ON p.得意先CD = c.得意先CD
      LEFT JOIN ET0010担当者 r ON c.営業担当CD = r.担当者CD
      WHERE c.得意先名 LIKE @search
        ${repCode !== undefined ? "AND c.営業担当CD = @repCode" : ""}
      ORDER BY p.得意先CD
    `);

  const now = new Date();
  const rows = result.recordset.map((r) => {
    const dueDate = computeDueDate(r.previousClosingDate, r.collectionCycle, r.collectionDay);
    const outstandingAmount = r.previousInvoice - r.afterInvoicePayment;
    const isOverdue = dueDate !== null && dueDate < now && outstandingAmount > 0;
    return {
      customerCode: r.customerCode,
      customerName: r.customerName,
      repName: r.repName,
      dueDate: dueDate ? dueDate.toISOString() : null,
      previousInvoice: r.previousInvoice,
      afterInvoicePayment: r.afterInvoicePayment,
      outstandingAmount,
      isOverdue,
    };
  });

  const filtered = showAll ? rows : rows.filter((r) => r.isOverdue);
  filtered.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  res.json(filtered);
});

paymentsRouter.get("/payments/:customerCode", async (req, res) => {
  const customerCode = Number(req.params.customerCode);
  if (!Number.isInteger(customerCode)) {
    res.status(400).json({ message: "得意先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("customerCode", sql.Int, customerCode)
    .query(`
      SELECT
        p.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        r.担当者名 AS repName,
        p.回収サイクル AS collectionCycle,
        p.回収日 AS collectionDay,
        p.今回入金 AS currentPayment,
        p.今回売上 AS currentSales,
        p.今回請求 AS currentInvoice,
        p.前回入金 AS previousPayment,
        p.前回売上 AS previousSales,
        p.前回請求 AS previousInvoice,
        p.前々回入金 AS twoAgoPayment,
        p.前々回売上 AS twoAgoSales,
        p.前々回請求 AS twoAgoInvoice,
        p.前々々回入金 AS threeAgoPayment,
        p.前々々回売上 AS threeAgoSales,
        p.前々々回請求 AS threeAgoInvoice,
        p.請求後入金 AS afterInvoicePayment,
        p.前回請求締日 AS previousClosingDate
      FROM ET0160入金確認 p
      JOIN ET0020得意先 c ON p.得意先CD = c.得意先CD
      LEFT JOIN ET0010担当者 r ON c.営業担当CD = r.担当者CD
      WHERE p.得意先CD = @customerCode
    `);
  const row = result.recordset[0];
  if (!row) {
    res.status(404).json({ message: "入金確認データが見つかりません" });
    return;
  }
  const dueDate = computeDueDate(row.previousClosingDate, row.collectionCycle, row.collectionDay);
  const outstandingAmount = row.previousInvoice - row.afterInvoicePayment;
  const isOverdue = dueDate !== null && dueDate < new Date() && outstandingAmount > 0;
  res.json({ ...row, dueDate: dueDate ? dueDate.toISOString() : null, outstandingAmount, isOverdue });
});
