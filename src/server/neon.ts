import { intentdb } from "intentdb";

const client = intentdb(process.env.DATABASE_URL!);

export const primarySql = client;
export const replicaSql = client;
export const sql = client;
export const neon = (_url?: string) => client;

