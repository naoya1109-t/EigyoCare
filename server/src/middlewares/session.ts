import session from "express-session";
import { env } from "../config/env";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MSSQLStore = require("connect-mssql-v2");

const store = new MSSQLStore(
  {
    server: env.db.session.server,
    database: env.db.session.database,
    user: env.db.session.user,
    password: env.db.session.password,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
  },
  {
    table: "app.Sessions",
  },
);

export const sessionMiddleware = session({
  store,
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8,
  },
});
