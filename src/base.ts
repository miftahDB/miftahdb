import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";
import type { IMiftahDB, Value, MiftahDBItem } from "./types";
import type { Database, Statement } from "better-sqlite3";

export abstract class BaseMiftahDB implements IMiftahDB {
  protected declare db: Database;
  private statements: Record<string, Statement>;

  constructor(path = ":memory:") {
    this.initializeDB(path);
    this.initDatabase();
    this.statements = this.prepareStatements();
  }

  protected abstract initializeDB(path: string | ":memory:"): void;

  private prepareStatements(): Record<string, Statement> {
    return {
      get: this.db.prepare(SQL_STATEMENTS.GET),
      set: this.db.prepare(SQL_STATEMENTS.SET),
      exists: this.db.prepare(SQL_STATEMENTS.EXISTS),
      delete: this.db.prepare(SQL_STATEMENTS.DELETE),
      rename: this.db.prepare(SQL_STATEMENTS.RENAME),
      getExpire: this.db.prepare(SQL_STATEMENTS.GET_EXPIRE),
      setExpire: this.db.prepare(SQL_STATEMENTS.SET_EXPIRE),
      keys: this.db.prepare(SQL_STATEMENTS.KEYS),
      pagination: this.db.prepare(SQL_STATEMENTS.PAGINATION),
      cleanup: this.db.prepare(SQL_STATEMENTS.CLEANUP),
      countKeys: this.db.prepare(SQL_STATEMENTS.COUNT_KEYS),
      countExpired: this.db.prepare(SQL_STATEMENTS.COUNT_EXPIRED),
      vacuum: this.db.prepare(SQL_STATEMENTS.VACUUM),
      flush: this.db.prepare(SQL_STATEMENTS.FLUSH),
    };
  }

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

  public set<T extends Value>(key: string, value: T, expiresAt?: Date): void {
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
  }

  public cleanup(): void {
    this.statements.cleanup.run(Date.now());
  }

  public flush(): void {
    this.statements.flush.run();
  }

  public execute(sql: string, params: unknown[] = []): unknown | null {
    const stmt = this.db.prepare(sql);
    const isBun = typeof Bun !== "undefined";
    if (isBun) {
      return stmt.all(...params);
    }
    if (stmt.reader) {
      return stmt.all(...params);
    }
    return stmt.run(...params);
  }
}
