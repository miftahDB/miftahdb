import DB, {
  type Database,
  type Statement,
  type RunResult,
} from "better-sqlite3";
import { SQL_STATEMENTS } from "./statements";
import type { IMiftahDB, MiftahValue, MiftahDBItem } from "./types";
import { encodeValue, decodeValue } from "./encoding";
import { writeFileSync, readFileSync } from "node:fs";

export abstract class BaseMiftahDB implements IMiftahDB {
  protected declare db: Database;
  protected statements: Record<string, Statement>;

  constructor(path = ":memory:") {
    this.initDatabase(path);
    this.db.exec(SQL_STATEMENTS.CREATE_PRAGMA);
    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);
    this.statements = this.prepareStatements();
  }

  protected abstract initDatabase(path: string | ":memory:"): void;

  protected prepareStatements(): Record<string, Statement> {
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

  get<T>(key: string): T | null {
    const result = this.statements.get.get(key) as MiftahDBItem | undefined;
    if (!result) return null;
    if (result?.expires_at && result.expires_at <= Date.now()) {
      this.delete(key);
      return null;
    }
    return decodeValue(result.value);
  }

  set<T extends MiftahValue>(key: string, value: T, expiresAt?: Date): void {
    const encodedValue = encodeValue(value);
    const expiresAtMs = expiresAt?.getTime() ?? null;
    this.statements.set.run(key, encodedValue, expiresAtMs);
  }

  exists(key: string): boolean {
    const result = this.statements.exists.get(key) as { [key: string]: number };
    return Boolean(Object.values(result)[0]);
  }

  delete(key: string): void {
    this.statements.delete.run(key);
  }

  rename(oldKey: string, newKey: string): void {
    this.statements.rename.run(newKey, oldKey);
  }

  setExpire(key: string, expiresAt: Date): void {
    const expiresAtMs = expiresAt.getTime();
    this.statements.setExpire.run(expiresAtMs, key);
  }

  getExpire(key: string): Date | null {
    const result = this.statements.getExpire.get(key) as
      | {
          expires_at: number | null;
        }
      | undefined;
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  keys(pattern = "%"): string[] {
    const result = this.statements.keys.all(pattern) as {
      key: string;
    }[];
    return result.map((r) => r.key);
  }

  pagination(limit: number, page: number, pattern = "%"): string[] {
    const offset = (page - 1) * limit;
    const result = this.statements.pagination.all(pattern, limit, offset) as {
      key: string;
    }[];
    return result.map((r) => r.key);
  }

  count(pattern = "%"): number {
    const result = this.statements.countKeys.get(pattern) as { count: number };
    return result.count;
  }

  countExpired(pattern = "%"): number {
    const result = this.statements.countExpired.get(pattern) as {
      count: number;
    };
    return result.count;
  }

  multiGet<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    this.db.transaction(() => {
      for (const key of keys) {
        result[key] = this.get<T>(key);
      }
    })();
    return result;
  }

  multiSet<T extends MiftahValue>(
    entries: Array<{ key: string; value: T; expiresAt?: Date }>
  ): void {
    this.db.transaction(() => {
      for (const entry of entries) {
        this.set(entry.key, entry.value, entry.expiresAt);
      }
    })();
  }

  multiDelete(keys: string[]): void {
    this.db.transaction(() => {
      for (const key of keys) {
        this.delete(key);
      }
    })();
  }

  vacuum(): void {
    this.statements.vacuum.run();
  }

  close(): void {
    this.cleanup();
    this.db.close();
  }

  cleanup(): void {
    this.statements.cleanup.run(Date.now());
  }

  flush(): void {
    this.statements.flush.run();
  }

  backup(path: string): void {
    const serialized = this.db.serialize();
    const arrayBuffer = serialized.buffer.slice(
      serialized.byteOffset,
      serialized.byteOffset + serialized.byteLength
    );
    writeFileSync(path, Buffer.from(arrayBuffer));
  }

  execute(sql: string, params: unknown[] = []): unknown[] | RunResult {
    const stmt = this.db.prepare(sql);
    if (stmt.reader) {
      return stmt.all(...params);
    }
    return stmt.run(...params);
  }

  restore(path: string) {
    const file = readFileSync(path);
    this.db = new DB(file);
    this.statements = this.prepareStatements();
  }
}
