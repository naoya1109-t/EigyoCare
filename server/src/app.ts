import express from "express";
import path from "path";
import { env } from "./config/env";
import { sessionMiddleware } from "./middlewares/session";
import { authRouter } from "./routes/auth";
import { getReadonlyPool } from "./db/connection";

const app = express();

app.use(express.json());
app.use(sessionMiddleware);

app.use("/api", authRouter);

app.get("/api/health/db", async (_req, res) => {
  await getReadonlyPool();
  res.json({ status: "ok" });
});

const clientDist = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(env.port, () => {
  console.log(`server listening on port ${env.port}`);
});
