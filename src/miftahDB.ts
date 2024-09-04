import SQLiteDatabase, { Database, Statement } from "better-sqlite3";
import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";
import type { IMiftahDB, KeyValue, MiftahDBItem } from "./types.ts";

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
  };

  /**
   * Creates a MiftahDB instance.
   * @param path - The path to the SQLite database file, or ":memory:" to use an in-memory database.
   */
  constructor(path: string | ":memory:") {
    this.db = new SQLiteDatabase(path);
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
    };
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
  public setExpire(key: string, expiresAt: Date): void {
    const expiresAtMs = expiresAt.getTime();
    this.statements.setExpire.run(expiresAtMs, key);
  }

  /**
   * @inheritdoc
   */
  public getExpire(key: string): Date | null {
    const result = this.statements.getExpire.get(key) as {
      expires_at: number | null;
    };
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  /**
   * @inheritdoc
   */
  public keys(pattern: string = "%"): string[] {
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
  public pagination(
    limit: number,
    page: number,
    pattern: string = "%"
  ): string[] {
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
  public size(): number {
    // @ts-ignore it will always be a number
    const pageCount = this.db.prepare("PRAGMA page_count").value() as number;

    // @ts-ignore it will always be a number
    const pageSize = this.db.prepare("PRAGMA page_size").value() as number;

    return pageCount * pageSize;
  }
}

export default MiftahDB;
