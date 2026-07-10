import sql, { ConnectionPool } from "mssql";
import { env } from "../config/env";

let readonlyPool: ConnectionPool | null = null;

export async function getReadonlyPool(): Promise<ConnectionPool> {
  if (readonlyPool) {
    return readonlyPool;
  }
  readonlyPool = await new sql.ConnectionPool({
    server: env.db.readonly.server,
    database: env.db.readonly.database,
    user: env.db.readonly.user,
    password: env.db.readonly.password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  }).connect();
  return readonlyPool;
}
