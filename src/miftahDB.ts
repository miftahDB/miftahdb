import SQLiteDatabase, { Database, Statement } from "better-sqlite3";
import { IMiftahDB, KeyValue, MiftahDBItem } from "./types";
import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";

/**
 * MiftahDB - A key-value store built on top of SQLite.
 * @implements {IMiftahDB}
 * @template T
 */
class MiftahDB implements IMiftahDB {
  private readonly db: Database;
  private readonly getStmt: Statement;
  private readonly setStmt: Statement;
  private readonly existsStmt: Statement;
  private readonly deleteStmt: Statement;
  private readonly renameStmt: Statement;
  private readonly expireAtStmt: Statement;
  private readonly keysStmt: Statement;
  private readonly cleanupStmt: Statement;

  /**
   * Creates a MiftahDB instance.
   * @param path - The path to the SQLite database file.
   */
  constructor(path: string) {
    this.db = new SQLiteDatabase(path, { fileMustExist: false });
    this.initDatabase();

    this.getStmt = this.db.prepare(SQL_STATEMENTS.GET);
    this.setStmt = this.db.prepare(SQL_STATEMENTS.SET);
    this.existsStmt = this.db.prepare(SQL_STATEMENTS.EXISTS);
    this.deleteStmt = this.db.prepare(SQL_STATEMENTS.DELETE);
    this.renameStmt = this.db.prepare(SQL_STATEMENTS.RENAME);
    this.expireAtStmt = this.db.prepare(SQL_STATEMENTS.EXPIRE);
    this.keysStmt = this.db.prepare(SQL_STATEMENTS.KEYS);
    this.cleanupStmt = this.db.prepare(SQL_STATEMENTS.CLEANUP);
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
    const result = this.getStmt.get(key) as MiftahDBItem | undefined;

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

    this.setStmt.run(key, encodedValue, expiresAtMs);
  }

  /**
   * @inheritdoc
   */
  public exists(key: string): boolean {
    const result = this.existsStmt.get(key) as { [key: string]: number };
    return !!Object.values(result)[0];
  }

  /**
   * @inheritdoc
   */
  public delete(key: string): void {
    this.deleteStmt.run(key);
  }

  /**
   * @inheritdoc
   */
  public rename(oldKey: string, newKey: string): void {
    this.renameStmt.run(newKey, oldKey);
  }

  /**
   * @inheritdoc
   */
  public expireAt(key: string): Date | null {
    const result = this.expireAtStmt.get(key) as { [key: string]: number };
    return result?.expires_at ? new Date(result.expires_at) : null;
  }

  /**
   * @inheritdoc
   */
  public keys(pattern: string = "%"): string[] {
    const result = this.keysStmt.all(pattern) as { key: string }[];
    return result.map((item) => item.key);
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
    this.cleanupStmt.run(now);
  }

  /**
   * @inheritdoc
   */
  public flush(): void {
    this.db.exec(SQL_STATEMENTS.FLUSH);
  }
}

export default MiftahDB;
