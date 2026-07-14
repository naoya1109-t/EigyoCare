import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

// 入金確認の「未入金（期限切れ）」判定は ET0160入金確認 のスナップショット列だけでは正確に出せない。
// 理由: 前回請求締日は残高が動いていなくても毎月更新されるため、それを起点に支払期日を計算すると
// 古い未収金でも常に「来月が期日」に見えてしまう（得意先CD:42532 ヤマトヒューマンで発覚）。
// また各「入金」列は同じラベルの「請求」に対する入金ではなく、1サイクル前の請求に対する入金であり
// （締めタイミングのラグ）、かつ複数サイクル分の残高をまとめて後から一括精算するケースもあるため、
// ET0160の3サイクル分のスナップショットだけを機械的に辿る方式では正しく判定できない
// （得意先CD:12010 アイコーメディカルで発覚。5/20締め請求164,039円は6/20締め請求に記録された
// 入金164,039円で完済されていたが、前段のロジックでは誤って4/20締め分を未精算と判定していた）。
//
// そのため ET0110請求（本日以前が支払期日の請求のうち直近1件＝target）を基準に、
// - target がその得意先の最新請求であれば、ET0160の「請求後入金」（ラグの無い実入金額）
// - target がそれより古い請求であれば、target の次に発行された請求の「入金額」
//   （ラグの規則により、次請求の入金額が target の残高に対する実際の入金となる）
// を「精算に使われた入金額」として比較し、残額が残っていれば未入金（期限切れ）とする。
// 実データで検証済み（42532/1: 期限切れと正しく判定、48180/11/12010: 完済済みとして正しく除外）。
const OVERDUE_CTE = `
  WITH Ordered AS (
    SELECT i.得意先CD, i.請求日, i.回収予定日, i.今回請求残高,
      LEAD(i.入金額) OVER (PARTITION BY i.得意先CD ORDER BY i.請求日) AS nextPayment,
      CAST(ROW_NUMBER() OVER (PARTITION BY i.得意先CD ORDER BY i.請求日 DESC) AS INT) AS rnDesc
    FROM ET0110請求 i
  ),
  DueInvoices AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY 得意先CD ORDER BY 請求日 DESC) AS rnDue
    FROM Ordered
    WHERE 回収予定日 <= GETDATE()
  )
`;

interface OverdueRow {
  customerCode: number;
  targetBalance: number;
  nextPayment: number | null;
  rnDesc: number;
  afterInvoicePayment: number | null;
}

function computeOverdue(row: OverdueRow) {
  const paymentReceived = row.rnDesc === 1 ? (row.afterInvoicePayment ?? 0) : (row.nextPayment ?? 0);
  const outstandingAmount = row.targetBalance - paymentReceived;
  return { paymentReceived, outstandingAmount, isOverdue: outstandingAmount > 0 };
}

paymentsRouter.get("/payments", async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const showAll = req.query.all === "true";
  const repCode = req.query.repCode ? Number(req.query.repCode) : undefined;
  const pool = await getReadonlyPool();
  const request = pool.request().input("search", sql.NVarChar, `%${search}%`);
  if (repCode !== undefined) request.input("repCode", sql.SmallInt, repCode);
  const result = await request.query(`
      ${OVERDUE_CTE}
      SELECT
        c.得意先CD AS customerCode,
        c.得意先名 AS customerName,
        rep.担当者名 AS repName,
        d.回収予定日 AS dueDate,
        d.今回請求残高 AS targetBalance,
        d.nextPayment,
        d.rnDesc,
        p.請求後入金 AS afterInvoicePayment
      FROM DueInvoices d
      JOIN ET0020得意先 c ON c.得意先CD = d.得意先CD
      LEFT JOIN ET0010担当者 rep ON c.営業担当CD = rep.担当者CD
      LEFT JOIN ET0160入金確認 p ON p.得意先CD = d.得意先CD
      WHERE d.rnDue = 1
        AND c.得意先名 LIKE @search
        ${repCode !== undefined ? "AND c.営業担当CD = @repCode" : ""}
    `);

  const rows = result.recordset.map((r) => {
    const overdue = computeOverdue(r);
    return {
      customerCode: r.customerCode,
      customerName: r.customerName,
      repName: r.repName,
      dueDate: (r.dueDate as Date).toISOString(),
      invoiceAmount: r.targetBalance,
      paymentReceived: overdue.paymentReceived,
      outstandingAmount: overdue.outstandingAmount,
      isOverdue: overdue.isOverdue,
    };
  });

  const filtered = showAll ? rows : rows.filter((r) => r.isOverdue);
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
  const request = pool.request().input("customerCode", sql.Int, customerCode);

  const headerResult = await request.query(`
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

  const dueResult = await pool
    .request()
    .input("customerCode", sql.Int, customerCode)
    .query(`
      ${OVERDUE_CTE}
      SELECT 回収予定日 AS dueDate, 今回請求残高 AS targetBalance, nextPayment, rnDesc
      FROM DueInvoices
      WHERE 得意先CD = @customerCode AND rnDue = 1
    `);
  const due = dueResult.recordset[0];

  if (!due) {
    res.json({ ...header, dueDate: null, invoiceAmount: 0, paymentReceived: 0, outstandingAmount: 0, isOverdue: false });
    return;
  }
  const overdue = computeOverdue({ ...due, customerCode, afterInvoicePayment: header.afterInvoicePayment });
  res.json({
    ...header,
    dueDate: (due.dueDate as Date).toISOString(),
    invoiceAmount: due.targetBalance,
    paymentReceived: overdue.paymentReceived,
    outstandingAmount: overdue.outstandingAmount,
    isOverdue: overdue.isOverdue,
  });
});
