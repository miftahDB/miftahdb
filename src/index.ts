import DB, { type Database } from "better-sqlite3";
import { BaseMiftahDB } from "./base";

export class MiftahDB extends BaseMiftahDB {
  protected declare db: Database;
  protected initializeDB(path: string | ":memory:"): void {
    this.db = new DB(path);
  }
}
