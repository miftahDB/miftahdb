import SQLiteDatabase, { Database, Statement } from "better-sqlite3";
import { IMiftahDB, KeyValue, MiftahDBItem } from "./types";
import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";
import * as fs from "fs";

/**
 * MiftahDB - A key-value store built on top of SQLite.
 * @implements {IMiftahDB}
 * @template T
 */
class MiftahDB implements IMiftahDB {
  private readonly db: Database;
  private readonly statements: {
    get: Statement;
    set: Statement;
    exists: Statement;
    delete: Statement;
    rename: Statement;
    getExpire: Statement;
    setExpire: Statement;
    keys: Statement;
    pagination: Statement;
    cleanup: Statement;
    count: Statement;
    countExpired: Statement;
    vacuum: Statement;
    flush: Statement;
  };

  /**
   * Creates a MiftahDB instance.
   * @param path - The path to the SQLite database file, or ":memory:" to use an in-memory database.
   */
  constructor(path: string | ":memory:") {
    this.db = new SQLiteDatabase(path, { fileMustExist: false });
    this.initDatabase();

    this.statements = {
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
      count: this.db.prepare(SQL_STATEMENTS.COUNT_KEYS),
      countExpired: this.db.prepare(SQL_STATEMENTS.COUNT_EXPIRED),
      vacuum: this.db.prepare(SQL_STATEMENTS.VACUUM),
      flush: this.db.prepare(SQL_STATEMENTS.FLUSH),
    };
  }

  /**
   * Initializes the database with optimal settings and schema.
   * @private
   */
  private initDatabase(): void {
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("temp_store = MEMORY");
    this.db.pragma("cache_size = -64000"); // 64MB cache
    this.db.pragma("mmap_size = 30000000000"); // 30GB mmap

    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);
  }

  /**
   * @inheritdoc
   */
  public get<T>(key: string): T | null {
    const result = this.statements.get.get(key) as MiftahDBItem | undefined;

    if (!result) return null;

    if (result.expires_at && result.expires_at <= Date.now()) {
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
    const expiresAtMs = expiresAt ? expiresAt.getTime() : null;

    this.statements.set.run(key, encodedValue, expiresAtMs);
  }

  /**
   * @inheritdoc
   */
  public exists(key: string): boolean {
    const result = this.statements.exists.get(key) as { [key: string]: number };
    return !!Object.values(result)[0];
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
  public getExpire(key: string): Date | null {
    const result = this.statements.getExpire.get(key) as {
      [key: string]: number;
    };
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  public setExpire(key: string, expiresAt: Date): void {
    const expiresAtMs = expiresAt.getTime();
    this.statements.setExpire.run(expiresAtMs, key);
  }

  /**
   * @inheritdoc
   */
  public keys(pattern: string = "%"): string[] {
    const result = this.statements.keys.all(pattern) as { key: string }[];
    return result.map((item) => item.key);
  }

  public pagination(
    limit: number,
    page: number,
    pattern: string = "%"
  ): string[] {
    const result = this.statements.pagination.all(pattern, limit, page) as {
      key: string;
    }[];
    return result.map((item) => item.key);
  }

  /**
   * @inheritdoc
   */
  public count(): number {
    const result = this.db.prepare(SQL_STATEMENTS.COUNT_KEYS).get() as {
      [key: string]: number;
    };
    return Object.values(result)[0];
  }

  /**
   * @inheritdoc
   */
  public countExpired(): number {
    const result = this.db.prepare(SQL_STATEMENTS.COUNT_EXPIRED).get() as {
      [key: string]: number;
    };
    return Object.values(result)[0];
  }

  /**
   * @inheritdoc
   */
  public vacuum(): void {
    this.db.exec(SQL_STATEMENTS.VACUUM);
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
    const now = Date.now();
    this.statements.cleanup.run(now);
  }

  /**
   * @inheritdoc
   */
  public flush(): void {
    this.db.exec(SQL_STATEMENTS.FLUSH);
  }

  /**
   * @inheritdoc
   */
  public execute(sql: string, params: any[] = []): any | null {
    const stmt = this.db.prepare(sql);

    return stmt.all(...params);
  }

  /**
   * @inheritdoc
   */
  public getStats() {
    const totalRecords = this.count();
    const expiredRecords = this.countExpired();
    const dbName = this.db.name;

    const pageCount = this.db
      .prepare("PRAGMA page_count")
      .pluck()
      .get() as number;
    const pageSize = this.db
      .prepare("PRAGMA page_size")
      .pluck()
      .get() as number;
    const dbSize = pageCount * pageSize;

    return {
      totalRecords,
      expiredRecords,
      dbSize,
      dbName,
    };
  }
}

export default MiftahDB;
