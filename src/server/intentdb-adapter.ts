import {
  ColumnTypeEnum,
  type ColumnType,
  type SqlDriverAdapter,
  type SqlDriverAdapterFactory,
  type SqlQuery,
  type SqlResultSet,
  type Transaction,
} from "@prisma/driver-adapter-utils";

function mapDataTypeId(dataTypeId: number): ColumnType {
  switch (dataTypeId) {
    case 16:
      return ColumnTypeEnum.Boolean;
    case 20:
      return ColumnTypeEnum.Int64;
    case 21:
    case 23:
      return ColumnTypeEnum.Int32;
    case 700:
      return ColumnTypeEnum.Float;
    case 701:
      return ColumnTypeEnum.Double;
    case 1700:
      return ColumnTypeEnum.Numeric;
    case 1082:
      return ColumnTypeEnum.Date;
    case 1083:
    case 1266:
      return ColumnTypeEnum.Time;
    case 1114:
    case 1184:
      return ColumnTypeEnum.DateTime;
    case 114:
    case 3802:
      return ColumnTypeEnum.Json;
    case 2950:
      return ColumnTypeEnum.Uuid;
    default:
      return ColumnTypeEnum.Text;
  }
}

interface IntentDbQueryResponse {
  status: "ok" | "error";
  rows?: Record<string, unknown>[];
  rowCount?: number | null;
  fields?: { name: string; dataTypeID: number }[];
  message?: string;
}

export class PrismaIntentDB implements SqlDriverAdapterFactory, SqlDriverAdapter {
  readonly provider = "postgres" as const;
  readonly adapterName = "intentdb";

  private origin: string;
  private key: string;

  constructor(connectionString?: string) {
    const raw = connectionString || process.env.DATABASE_URL;
    if (!raw) {
      throw new Error("DATABASE_URL is required for IntentDB connection");
    }
    const normalized = raw.replace(/^intentdb:\/\//, "https://");
    const parsed = new URL(
      normalized.startsWith("http://") || normalized.startsWith("https://")
        ? normalized
        : `https://${normalized}`,
    );

    this.origin = parsed.origin;
    this.key = decodeURIComponent(parsed.username || "");
  }

  private async executeQuery(
    query: string,
    params: unknown[] = [],
  ): Promise<IntentDbQueryResponse> {
    const res = await fetch(`${this.origin}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.key ? { Authorization: `Bearer ${this.key}` } : {}),
      },
      cache: "no-store",
      body: JSON.stringify({ query, params }),
    });

    const data = (await res.json().catch(() => null)) as IntentDbQueryResponse;
    if (!res.ok || data?.status !== "ok") {
      throw new Error(data?.message || `[IntentDB] HTTP ${res.status}`);
    }

    return data;
  }

  async queryRaw(param: SqlQuery): Promise<SqlResultSet> {
    const res = await this.executeQuery(param.sql, param.args || []);
    const fields = res.fields || [];
    const columnNames = fields.map((f) => f.name);
    const columnTypes = fields.map((f) => mapDataTypeId(f.dataTypeID));
    const rows = (res.rows || []).map((row) =>
      fields.map((f) => row[f.name]),
    );

    return {
      columnNames,
      columnTypes,
      rows,
    };
  }

  async executeRaw(param: SqlQuery): Promise<number> {
    const res = await this.executeQuery(param.sql, param.args || []);
    return res.rowCount ?? 0;
  }

  async executeScript(script: string): Promise<void> {
    await this.executeQuery(script, []);
  }

  async startTransaction(): Promise<Transaction> {
    await this.executeQuery("BEGIN", []);
    const self = this;
    return {
      provider: "postgres",
      adapterName: "intentdb",
      options: { usePhantomQuery: false },
      queryRaw: (p) => self.queryRaw(p),
      executeRaw: (p) => self.executeRaw(p),
      commit: async () => {
        await self.executeQuery("COMMIT", []);
      },
      rollback: async () => {
        await self.executeQuery("ROLLBACK", []);
      },
    };
  }

  async dispose(): Promise<void> {}

  async connect(): Promise<SqlDriverAdapter> {
    return this;
  }
}
