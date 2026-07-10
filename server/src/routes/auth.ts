import { Router } from "express";
import bcrypt from "bcrypt";
import sql from "mssql";
import { getReadonlyPool } from "../db/connection";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { userId, password } = req.body as { userId?: string; password?: string };
  if (!userId || !password) {
    res.status(400).json({ message: "ユーザーIDとパスワードを入力してください" });
    return;
  }

  const pool = await getReadonlyPool();
  const result = await pool
    .request()
    .input("userId", sql.NVarChar, userId)
    .query("SELECT ユーザーID AS userId, パスワードハッシュ AS passwordHash, 担当者コード AS repCode FROM AppUser WHERE ユーザーID = @userId");

  const user = result.recordset[0];
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ message: "ユーザーIDまたはパスワードが正しくありません" });
    return;
  }

  req.session.userId = user.userId;
  req.session.repCode = user.repCode;
  res.json({ userId: user.userId, repCode: user.repCode });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(204).send();
  });
});
