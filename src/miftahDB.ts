import SQLiteDatabase, { type Database, type Statement } from "better-sqlite3";
import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";
import type { IMiftahDB, KeyValue, MiftahDBItem } from "./types";

/**
 * MiftahDB - A key-value store built on top of SQLite.
 * @implements {IMiftahDB}
 * @template T
 */
class MiftahDB implements IMiftahDB {
  private readonly db: Database;
  private readonly statements: Record<string, Statement>;

  /**
   * Creates a MiftahDB instance.
   * @param path - The path to the SQLite database file, or ":memory:" to use an in-memory database.
   */
  constructor(path: string | ":memory:") {
    this.db = new SQLiteDatabase(path);
    this.initDatabase();
    this.statements = this.prepareStatements();
  }

  /**
   * Initializes the database with optimal settings and schema.
   * @private
   */
  private initDatabase(): void {
    this.db.exec(SQL_STATEMENTS.CREATE_PRAGMA);
    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);
  }

  /**
   * Prepares SQL statements for the database operations.
   * @private
   * @returns {Record<string, Statement>}
   */
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

  /**
   * @inheritdoc
   */
  public get<T>(key: string): T | null {
    const result = this.statements.get.get(key) as MiftahDBItem | undefined;
    if (!result) return null;
    if (result?.expires_at && result.expires_at <= Date.now()) {
      this.delete(key);
      return null;
    }
    return decodeValue(result.value);
  }

  /**
   * @inheritdoc
   */
  public set<T extends KeyValue>(
    key: string,
    value: T,
    expiresAt?: Date
  ): void {
    const encodedValue = encodeValue(value);
    const expiresAtMs = expiresAt?.getTime() ?? null;
    this.statements.set.run(key, encodedValue, expiresAtMs);
  }

  /**
   * @inheritdoc
   */
  public exists(key: string): boolean {
    const result = this.statements.exists.get(key) as { [key: string]: number };
    return Boolean(Object.values(result)[0]);
  }

  /**
   * @inheritdoc
   */
  public delete(key: string): void {
    this.statements.delete.run(key);
  }

  /**
   * @inheritdoc
   */
  public rename(oldKey: string, newKey: string): void {
    this.statements.rename.run(newKey, oldKey);
  }

  /**
   * @inheritdoc
   */
  public setExpire(key: string, expiresAt: Date): void {
    const expiresAtMs = expiresAt.getTime();
    this.statements.setExpire.run(expiresAtMs, key);
  }

  /**
   * @inheritdoc
   */
  public getExpire(key: string): Date | null {
    const result = this.statements.getExpire.get(key) as
      | {
          expires_at: number | null;
        }
      | undefined;
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  /**
   * @inheritdoc
   */
  public keys(pattern = "%"): string[] {
    const result = this.statements.keys.all(pattern) as {
      key: string;
    }[];
    const keys: string[] = new Array(result.length);
    for (let i = 0; i < result.length; i++) {
      keys[i] = result[i].key;
    }

    return keys;
  }

  /**
   * @inheritdoc
   */
  public pagination(limit: number, page: number, pattern = "%"): string[] {
    const offset = (page - 1) * limit;
    const result = this.statements.pagination.all(pattern, limit, offset) as {
      key: string;
    }[];
    const keys: string[] = new Array(result.length);
    for (let i = 0; i < result.length; i++) {
      keys[i] = result[i].key;
    }
    return keys;
  }

  /**
   * @inheritdoc
   */
  public count(pattern = "%"): number {
    const result = this.statements.countKeys.get(pattern) as { count: number };
    return result.count;
  }

  /**
   * @inheritdoc
   */
  public countExpired(pattern = "%"): number {
    const result = this.statements.countExpired.get(pattern) as {
      count: number;
    };
    return result.count;
  }

  /**
   * @inheritdoc
   */
  public vacuum(): void {
    this.statements.vacuum.run();
  }

  /**
   * @inheritdoc
   */
  public close(): void {
    this.cleanup();
    this.db.close();
  }

  /**
   * @inheritdoc
   */
  public cleanup(): void {
    this.statements.cleanup.run(Date.now());
  }

  /**
   * @inheritdoc
   */
  public flush(): void {
    this.statements.flush.run();
  }

  /**
   * @inheritdoc
   */
  public execute(sql: string, params: any[] = []): any | null {
    const stmt = this.db.prepare(sql);
    return stmt.all(...params);
  }
}

export default MiftahDB;
