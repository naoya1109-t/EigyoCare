import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

// 「未入金（期限切れ）」の判定は ET0160入金確認 や ET0110請求 自身の入金額列だけでは正確に出せない
// ことが実データで複数件判明した:
// - ET0160入金確認の各「入金」列は同じサイクルの請求に対する入金ではなく1サイクル前の請求への
//   入金であり（締めタイミングのラグ）、かつ複数サイクル分をまとめて後から精算するケースもある
//   （得意先CD:12010 アイコーメディカルで発覚）。
// - ET0160入金確認の前回請求締日は残高が動いていなくても毎月更新されるため、古い未収金でも
//   常に「来月が期日」に見えてしまう（得意先CD:42532 ヤマトヒューマンで発覚）。
// - ET0110請求自身の入金額も、実際に入金があった請求（得意先CD:45126 阿波銀ﾘｰｽ株式会社、
//   2024/8/20に644,600円入金済み）に反映されていないケースがあった。
//
// そのため、実際に入金があったかどうかは入金の実績テーブルである ET0150入金（得意先CD, 入金日,
// 入金額のみを持つシンプルな入金台帳）を正とする。判定は、支払期日が本日以前で直近の請求（target）
// を特定し、target の請求日より後に記録された ET0150入金 の合計額と target の今回請求残高
// （target 発行時点までの累積未収額）を比較する。
// 実データで6件検証済み（42532/1: 期限切れ、48180/11/12010/45126: 完済済みとして正しく除外）。
const TARGET_INVOICE_CTE = `
  WITH Ordered AS (
    SELECT 得意先CD, 請求日, 回収予定日, 今回請求残高,
      ROW_NUMBER() OVER (PARTITION BY 得意先CD ORDER BY 請求日 DESC) AS rnDesc
    FROM ET0110請求
    WHERE 回収予定日 <= GETDATE()
  ),
  TargetInvoice AS (
    SELECT * FROM Ordered WHERE rnDesc = 1
  )
`;

paymentsRouter.get("/payments", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;
  const pool = await getReadonlyPool();
  const request = pool.request().input("search", sql.NVarChar, `%${search}%`);
  if (repCode !== undefined) request.input("repCode", sql.SmallInt, repCode);
  const result = await request.query(`
      ${TARGET_INVOICE_CTE}
      SELECT
        c.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        rep.担当者名 AS repName,
        t.回収予定日 AS dueDate,
        t.今回請求残高 AS invoiceAmount,
        ISNULL(pay.totalPaid, 0) AS paymentReceived
      FROM TargetInvoice t
      JOIN ET0020得意先 c ON c.得意先CD = t.得意先CD
      LEFT JOIN ET0010担当者 rep ON c.営業担当CD = rep.担当者CD
      OUTER APPLY (
        SELECT SUM(pm.入金額) AS totalPaid
        FROM ET0150入金 pm
        WHERE pm.得意先CD = t.得意先CD AND pm.入金日 > t.請求日
      ) pay
      WHERE c.検索対象外 = 2
        AND c.得意先名 LIKE @search
        ${repCode !== undefined ? "AND c.営業担当CD = @repCode" : ""}
    `);

  const rows = result.recordset.map((r) => {
    const outstandingAmount = r.invoiceAmount - r.paymentReceived;
    return {
      customerCode: r.customerCode,
      customerName: r.customerName,
      repName: r.repName,
      dueDate: (r.dueDate as Date).toISOString(),
      invoiceAmount: r.invoiceAmount,
      paymentReceived: r.paymentReceived,
      outstandingAmount,
      isOverdue: outstandingAmount > 0,
    };
  });

  const filtered = rows.filter((r) => r.isOverdue);
  filtered.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  res.json(filtered);
});

paymentsRouter.get("/payments/:customerCode", async (req, res) => {
  const customerCode = Number(req.params.customerCode);
  if (!Number.isInteger(customerCode)) {
    res.status(400).json({ message: "得意先コードが不正です" });
    return;
  }
  const pool = await getReadonlyPool();

  const headerResult = await pool
    .request()
    .input("customerCode", sql.Int, customerCode)
    .query(`
      SELECT
        c.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        rep.担当者名 AS repName,
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
      FROM ET0020得意先 c
      LEFT JOIN ET0010担当者 rep ON c.営業担当CD = rep.担当者CD
      LEFT JOIN ET0160入金確認 p ON p.得意先CD = c.得意先CD
      WHERE c.得意先CD = @customerCode
    `);
  const header = headerResult.recordset[0];
  if (!header) {
    res.status(404).json({ message: "入金確認データが見つかりません" });
    return;
  }

  const targetResult = await pool
    .request()
    .input("customerCode", sql.Int, customerCode)
    .query(`
      ${TARGET_INVOICE_CTE}
      SELECT t.回収予定日 AS dueDate, t.今回請求残高 AS invoiceAmount, ISNULL(pay.totalPaid, 0) AS paymentReceived
      FROM TargetInvoice t
      OUTER APPLY (
        SELECT SUM(pm.入金額) AS totalPaid
        FROM ET0150入金 pm
        WHERE pm.得意先CD = t.得意先CD AND pm.入金日 > t.請求日
      ) pay
      WHERE t.得意先CD = @customerCode
    `);
  const target = targetResult.recordset[0];

  if (!target) {
    res.json({ ...header, dueDate: null, invoiceAmount: 0, paymentReceived: 0, outstandingAmount: 0, isOverdue: false });
    return;
  }
  const outstandingAmount = target.invoiceAmount - target.paymentReceived;
  res.json({
    ...header,
    dueDate: (target.dueDate as Date).toISOString(),
    invoiceAmount: target.invoiceAmount,
    paymentReceived: target.paymentReceived,
    outstandingAmount,
    isOverdue: outstandingAmount > 0,
  });
});
