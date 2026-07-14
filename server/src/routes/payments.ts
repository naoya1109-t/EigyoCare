import { Router } from "express";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";
import { requireAuth } from "../middlewares/requireAuth";

export const paymentsRouter = Router();
paymentsRouter.use(requireAuth);

// 指定した締日ルールを、基準となる締日から cyclesBack サイクル（月）前に適用した日付を算出する
function computeClosingDate(latestClosingDate: Date, closingDay: number, cyclesBack: number): Date {
  const target = new Date(Date.UTC(latestClosingDate.getUTCFullYear(), latestClosingDate.getUTCMonth() - cyclesBack, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const day = closingDay >= 31 ? lastDay : Math.min(closingDay, lastDay);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), day));
}

// 締日を起点に、回収サイクル（月数）後の回収日（31=末日）を支払期日として算出する
function computeDueDate(closingDate: Date, cycle: number, day: number): Date {
  const target = new Date(Date.UTC(closingDate.getUTCFullYear(), closingDate.getUTCMonth() + cycle, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  const targetDay = day >= 31 ? lastDay : Math.min(day, lastDay);
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), targetDay));
}

interface PaymentCycleRow {
  closingDay: number;
  collectionCycle: number;
  collectionDay: number;
  previousClosingDate: Date;
  threeAgoInvoice: number;
  twoAgoPayment: number;
  twoAgoInvoice: number;
  previousPayment: number;
  previousInvoice: number;
  afterInvoicePayment: number;
}

interface OverdueResult {
  dueDate: string | null;
  outstandingAmount: number;
  isOverdue: boolean;
}

// ET0160入金確認の各「入金」列は、実際にはその請求そのものではなく1サイクル前の請求に対する
// 入金額を表す（締めタイミングのラグ）。例えば「前回入金」は「前々回請求」に対する入金と一致する。
// そのため、各サイクルが精算済みかどうかは「そのサイクルの請求額」と「1サイクル後の入金額」を
// 比較して判定する（前回請求は請求後入金と比較。請求後入金だけがこのラグの無い実入金額のため）。
//
// また、残高が複数サイクルにわたって全く同額のまま動いていない得意先（本来なら毎月新しい支払期日
// に更新されるはずが、実際には何年も前の未収金がそのまま繰り越されているだけのケース）は、直近の
// 支払期日だけを見ると「まだ期日前」に見えてしまう。そこで前々々回・前々回・前回の3サイクルを古い
// 方から順に確認し、精算されていない最初のサイクルの支払期日を実際の期日として扱う。
//
// 実データで検証済み（得意先CD:42532 ヤマトヒューマン: 直近請求だけ見ると支払期日は未来だが、
// 実際は何年も前から同額が動いておらず、前々々回の時点で既に未精算 → その時点の支払期日で期限切れ。
// 得意先CD:11 レンティック中部: 前々回請求は前回入金でラグ込みで精算済みと判定され、直近請求のみ
// 未到来のため未期限切れと正しく判定される）
function computeOverdue(row: PaymentCycleRow, now: Date): OverdueResult {
  const outstandingAmount = row.previousInvoice - row.afterInvoicePayment;
  const cycles = [
    { invoice: row.threeAgoInvoice, clearedBy: row.twoAgoPayment, cyclesBack: 2 },
    { invoice: row.twoAgoInvoice, clearedBy: row.previousPayment, cyclesBack: 1 },
    { invoice: row.previousInvoice, clearedBy: row.afterInvoicePayment, cyclesBack: 0 },
  ];

  for (const cycle of cycles) {
    if (cycle.invoice > cycle.clearedBy) {
      const closingDate = computeClosingDate(row.previousClosingDate, row.closingDay, cycle.cyclesBack);
      const dueDate = computeDueDate(closingDate, row.collectionCycle, row.collectionDay);
      return {
        dueDate: dueDate.toISOString(),
        outstandingAmount,
        isOverdue: outstandingAmount > 0 && dueDate <= now,
      };
    }
  }
  return { dueDate: null, outstandingAmount, isOverdue: false };
}

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
        c.締日 AS closingDay,
        p.回収サイクル AS collectionCycle,
        p.回収日 AS collectionDay,
        p.前回請求締日 AS previousClosingDate,
        p.前々々回請求 AS threeAgoInvoice,
        p.前々回入金 AS twoAgoPayment,
        p.前々回請求 AS twoAgoInvoice,
        p.前回入金 AS previousPayment,
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
    const overdue = computeOverdue(r, now);
    return {
      customerCode: r.customerCode,
      customerName: r.customerName,
      repName: r.repName,
      dueDate: overdue.dueDate,
      previousInvoice: r.previousInvoice,
      afterInvoicePayment: r.afterInvoicePayment,
      outstandingAmount: overdue.outstandingAmount,
      isOverdue: overdue.isOverdue,
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
        c.締日 AS closingDay,
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
  const overdue = computeOverdue(row, new Date());
  res.json({ ...row, ...overdue });
});
