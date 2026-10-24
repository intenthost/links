import { neon as neonServerless } from "@neondatabase/serverless";
import { intentdb } from "intentdb";

function getSqlClient() {
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    return neonServerless(url);
  }
  return intentdb(url);
}

let _sql: any;
function getSql() {
  if (!_sql) _sql = getSqlClient();
  return _sql;
}

type NeonSql = (<T = Record<string, any>>(
  strings: TemplateStringsArray | string,
  ...values: any[]
) => Promise<T[]>) & {
  (query: string, params?: any[]): Promise<any>;
};

export const primarySql: NeonSql = ((...args: any[]) => {
  return (getSql() as any)(...args);
}) as any;
export const replicaSql = primarySql;
export const sql = primarySql;
export const neon = (url?: string) => (url ? neonServerless(url) : getSql());

