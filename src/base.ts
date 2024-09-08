import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";
import type { IMiftahDB, KeyValue, MiftahDBItem } from "./types";
import cron from "node-cron";

export abstract class BaseMiftahDB implements IMiftahDB {
  protected db: any;
  protected statements: Record<string, any>;
  private cleanup_cronjob: any;

  constructor(path: string | ":memory:", auto_clean = true, timeout = 5) {
    this.initializeDB(path);
    this.initDatabase();
    this.statements = this.prepareStatements();
    if (auto_clean) {
      this.auto_clean(timeout);
    }
  }
  private auto_clean(timeout: number = 5) {
    // cleanup expired keys every n minutes (default 5 minutes)
     this.cleanup_cronjob = cron.schedule(`*/${timeout} * * * *`, () => {
      this.cleanup();
    });
  }

  protected abstract initializeDB(path: string | ":memory:"): void;

  protected abstract prepareStatements(): Record<string, any>;

  private initDatabase(): void {
    this.db.exec(SQL_STATEMENTS.CREATE_PRAGMA);
    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);
  }

  public get<T>(key: string): T | null {
    const result = this.statements.get.get(key) as MiftahDBItem | undefined;
    if (!result) return null;
    if (result?.expires_at && result.expires_at <= Date.now()) {
      this.delete(key);
      return null;
    }
    return decodeValue(result.value);
  }

  public set<T extends KeyValue>(
    key: string,
    value: T,
    expiresAt?: Date,
  ): void {
    const encodedValue = encodeValue(value);
    const expiresAtMs = expiresAt?.getTime() ?? null;
    this.statements.set.run(key, encodedValue, expiresAtMs);
  }

  public exists(key: string): boolean {
    const result = this.statements.exists.get(key) as { [key: string]: number };
    return Boolean(Object.values(result)[0]);
  }

  public delete(key: string): void {
    this.statements.delete.run(key);
  }

  public rename(oldKey: string, newKey: string): void {
    this.statements.rename.run(newKey, oldKey);
  }

  public setExpire(key: string, expiresAt: Date): void {
    const expiresAtMs = expiresAt.getTime();
    this.statements.setExpire.run(expiresAtMs, key);
  }

  public getExpire(key: string): Date | null {
    const result = this.statements.getExpire.get(key) as
      | {
          expires_at: number | null;
        }
      | undefined;
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  public keys(pattern = "%"): string[] {
    const result = this.statements.keys.all(pattern) as {
      key: string;
    }[];
    return result.map((r) => r.key);
  }

  public pagination(limit: number, page: number, pattern = "%"): string[] {
    const offset = (page - 1) * limit;
    const result = this.statements.pagination.all(pattern, limit, offset) as {
      key: string;
    }[];
    return result.map((r) => r.key);
  }

  public count(pattern = "%"): number {
    const result = this.statements.countKeys.get(pattern) as { count: number };
    return result.count;
  }

  public countExpired(pattern = "%"): number {
    const result = this.statements.countExpired.get(pattern) as {
      count: number;
    };
    return result.count;
  }

  public vacuum(): void {
    this.statements.vacuum.run();
  }

  public close(): void {
    this.cleanup();
    this.db.close();
    this.cleanup_cronjob.stop();
  }

  public cleanup(): void {
    this.statements.cleanup.run(Date.now());
  }

  public flush(): void {
    this.statements.flush.run();
  }

  public execute(sql: string, params: any[] = []): any | null {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }
}
