import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  sessionSecret: requireEnv("SESSION_SECRET"),
  db: {
    readonly: {
      server: requireEnv("DB_READONLY_SERVER"),
      database: requireEnv("DB_READONLY_DATABASE"),
      user: requireEnv("DB_READONLY_USER"),
      password: requireEnv("DB_READONLY_PASSWORD"),
    },
    session: {
      server: requireEnv("DB_SESSION_SERVER"),
      database: requireEnv("DB_SESSION_DATABASE"),
      user: requireEnv("DB_SESSION_USER"),
      password: requireEnv("DB_SESSION_PASSWORD"),
    },
  },
};
