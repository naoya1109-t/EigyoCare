import express from "express";
import path from "path";
import { env } from "./config/env";
import { sessionMiddleware } from "./middlewares/session";
import { authRouter } from "./routes/auth";
import { customersRouter } from "./routes/customers";
import { suppliersRouter } from "./routes/suppliers";
import { salesRouter } from "./routes/sales";
import { budgetRouter } from "./routes/budget";
import { referenceRouter } from "./routes/reference";
import { invoicesRouter } from "./routes/invoices";
import { receivablesRouter } from "./routes/receivables";
import { paymentsRouter } from "./routes/payments";
import { returnsRouter } from "./routes/returns";
import { discountsRouter } from "./routes/discounts";
import { getReadonlyPool } from "./db/connection";

const app = express();

app.use(express.json());
app.use(sessionMiddleware);

// 各フィーチャールーターは router.use(requireAuth) をパス指定なしで適用しているため、
// /api にマウントされた別ルーターより後ろに置かれた無認証ルートは、途中のルーターの
// requireAuth に横取りされて到達できない。health/db は意図的に認証不要のため、
// 認証が必要なルーターより前に登録する。
app.get("/api/health/db", async (_req, res) => {
  await getReadonlyPool();
  res.json({ status: "ok" });
});

app.use("/api", authRouter);
app.use("/api", customersRouter);
app.use("/api", suppliersRouter);
app.use("/api", salesRouter);
app.use("/api", budgetRouter);
app.use("/api", referenceRouter);
app.use("/api", invoicesRouter);
app.use("/api", receivablesRouter);
app.use("/api", paymentsRouter);
app.use("/api", returnsRouter);
app.use("/api", discountsRouter);

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(env.port, () => {
  console.log(`server listening on port ${env.port}`);
});
