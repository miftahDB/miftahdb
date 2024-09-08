import DB, { type Database, type Statement } from "bun:sqlite";
import { BaseMiftahDB } from "./base";
import { SQL_STATEMENTS } from "./statements";

export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected declare statements: Record<string, Statement>;

  protected initializeDB(path: string | ":memory:"): void {
    this.db = new DB(path);
  }

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
}
