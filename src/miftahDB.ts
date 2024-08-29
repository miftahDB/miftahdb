import SQLiteDatabase, { Database, Statement } from "better-sqlite3";
import { IMiftahDB, KeyValue, MiftahDBItem } from "./types";
import { encodeValue, decodeValue } from "./encoding";
import { SQL_STATEMENTS } from "./statements";

class MiftahDB implements IMiftahDB {
  private readonly db: Database;
  private readonly getStmt: Statement;
  private readonly setStmt: Statement;
  private readonly deleteStmt: Statement;
  private readonly renameStmt: Statement;
  private readonly cleanupStmt: Statement;

  constructor(dbPath: string) {
    this.db = new SQLiteDatabase(dbPath, { fileMustExist: false });
    this.initDatabase();

    this.getStmt = this.db.prepare(SQL_STATEMENTS.GET);
    this.setStmt = this.db.prepare(SQL_STATEMENTS.SET);
    this.deleteStmt = this.db.prepare(SQL_STATEMENTS.DELETE);
    this.cleanupStmt = this.db.prepare(SQL_STATEMENTS.CLEANUP);
    this.renameStmt = this.db.prepare(SQL_STATEMENTS.RENAME);
  }

  private initDatabase(): void {
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("synchronous = NORMAL");
    this.db.pragma("temp_store = MEMORY");
    this.db.pragma("cache_size = -64000"); // 64MB cache
    this.db.pragma("mmap_size = 30000000000"); // 30GB mmap

    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);
  }

  public get<T>(key: string): T | null {
    const result = this.getStmt.get(key) as MiftahDBItem | undefined;

    if (!result) return null;

    if (result.expires_at && result.expires_at <= Date.now()) {
      this.delete(key);
      return null;
    }

    return decodeValue(result.value);
  }

  public set<T extends KeyValue>(
    key: string,
    value: T,
    expiresAt?: Date
  ): void {
    const encodedValue = encodeValue(value);
    const expiresAtMs = expiresAt ? expiresAt.getTime() : null;

    this.setStmt.run(key, encodedValue, expiresAtMs);
  }

  public delete(key: string): void {
    this.deleteStmt.run(key);
  }

  public rename(oldKey: string, newKey: string): void {
    this.renameStmt.run(newKey, oldKey);
  }

  public vacuum(): void {
    this.db.exec(SQL_STATEMENTS.VACUUM);
  }

  public close(): void {
    this.cleanup();
    this.db.close();
  }

  private cleanup(): void {
    const now = Date.now();
    this.cleanupStmt.run(now);
  }

  public flush(): void {
    this.db.exec(SQL_STATEMENTS.FLUSH);
  }
}

export default MiftahDB;
