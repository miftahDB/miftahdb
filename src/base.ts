import DB, {
  type Database,
  type Statement,
  type RunResult,
} from "better-sqlite3";
import { writeFile, readFile } from "node:fs/promises";

import { SQL_STATEMENTS } from "./statements";
import { encodeValue, decodeValue } from "./encoding";
import { SafeExecution, getExpireDate } from "./utils";

import type { IMiftahDB, MiftahValue, MiftahDBItem, Result } from "./types";

export abstract class BaseMiftahDB implements IMiftahDB {
  protected declare db: Database;
  protected statements: Record<string, Statement>;
  private nameSpacePrefix: string | null = null;

  constructor(path = ":memory:") {
    this.initDatabase(path);

    this.db.exec(SQL_STATEMENTS.CREATE_PRAGMA);
    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);

    this.statements = this.prepareStatements();
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

  protected abstract initDatabase(path: string | ":memory:"): void;

  private addNamespacePrefix(k: string): string {
    return this.nameSpacePrefix ? `${this.nameSpacePrefix}:${k}` : k;
  }

  private removeNamespacePrefix(key: string): string {
    return this.nameSpacePrefix && key.startsWith(`${this.nameSpacePrefix}:`)
      ? key.slice(this.nameSpacePrefix.length + 1)
      : key;
  }

  namespace(name: string): IMiftahDB {
    const namespacedDB = Object.create(this);
    namespacedDB.nameSpacePrefix = this.nameSpacePrefix
      ? `${this.nameSpacePrefix}:${name}`
      : name;

    return namespacedDB;
  }

  @SafeExecution
  get<T>(key: string): Result<T> {
    const result = this.statements.get.get(
      this.addNamespacePrefix(key)
    ) as MiftahDBItem | null;

    if (!result) throw Error("Key not found");
    if (result.expires_at && result.expires_at <= Date.now()) {
      this.delete(this.addNamespacePrefix(key));
      throw new Error("Key expired");
    }

    return {
      success: true,
      data: decodeValue(result.value) as T,
    };
  }

  @SafeExecution
  set<T extends MiftahValue>(
    key: string,
    value: T,
    expiresAt?: Date | number
  ): Result<boolean> {
    this.statements.set.run(
      this.addNamespacePrefix(key),
      encodeValue(value),
      getExpireDate(expiresAt)
    );

    return { success: true, data: true };
  }

  @SafeExecution
  exists(key: string): Result<boolean> {
    const result = this.statements.exists.get(this.addNamespacePrefix(key)) as {
      [key: string]: number;
    };

    const doExists = Boolean(Object.values(result)[0]);
    if (!doExists) throw Error("Key not found");

    return { success: true, data: doExists };
  }

  @SafeExecution
  delete(key: string): Result<number> {
    const result = this.statements.delete.run(this.addNamespacePrefix(key));

    return { success: true, data: result.changes };
  }

  @SafeExecution
  rename(oldKey: string, newKey: string): Result<boolean> {
    this.statements.rename.run(
      this.addNamespacePrefix(newKey),
      this.addNamespacePrefix(oldKey)
    );

    return { success: true, data: true };
  }

  @SafeExecution
  setExpire(key: string, expiresAt: Date | number): Result<boolean> {
    this.statements.setExpire.run(
      getExpireDate(expiresAt),
      this.addNamespacePrefix(key)
    );

    return { success: true, data: true };
  }

  @SafeExecution
  getExpire(key: string): Result<Date> {
    const result = this.statements.getExpire.get(
      this.addNamespacePrefix(key)
    ) as {
      expires_at: number | null;
    } | null;

    if (!result) throw Error("Key not found");
    if (!result.expires_at) throw Error("Key has no expiration");

    return { success: true, data: new Date(result.expires_at) };
  }

  @SafeExecution
  keys(pattern = "%"): Result<string[]> {
    const result = this.statements.keys.all(
      this.addNamespacePrefix(pattern)
    ) as {
      key: string;
    }[];

    if (result.length === 0) throw Error("No keys found");
    const resultArray = result.map((r) => this.removeNamespacePrefix(r.key));

    return {
      success: true,
      data: resultArray,
    };
  }

  @SafeExecution
  pagination(limit: number, page: number, pattern = "%"): Result<string[]> {
    const offset = (page - 1) * limit;
    const result = this.statements.pagination.all(
      this.addNamespacePrefix(pattern),
      limit,
      offset
    ) as { key: string }[];

    if (result.length === 0) throw Error("No keys found");
    const resultArray = result.map((r) => this.removeNamespacePrefix(r.key));

    return {
      success: true,
      data: resultArray,
    };
  }

  @SafeExecution
  count(pattern = "%"): Result<number> {
    const result = this.statements.countKeys.get(
      this.nameSpacePrefix ? `${this.nameSpacePrefix}:${pattern}` : pattern
    ) as { count: number };

    return { success: true, data: result.count };
  }

  @SafeExecution
  countExpired(pattern = "%"): Result<number> {
    const result = this.statements.countExpired.get(
      Date.now(),
      this.nameSpacePrefix ? `${this.nameSpacePrefix}:${pattern}` : pattern
    ) as {
      count: number;
    };

    return { success: true, data: result.count };
  }

  @SafeExecution
  multiGet<T>(keys: string[]): Result<Record<string, T | null>> {
    const result: Record<string, T | null> = {};
    this.db.transaction(() => {
      for (const k of keys) {
        const value = this.get<T>(k);
        if (value.success) result[this.removeNamespacePrefix(k)] = value.data;
      }
    })();

    return {
      success: true,
      data: result,
    };
  }

  @SafeExecution
  multiSet<T extends MiftahValue>(
    entries: Array<{ key: string; value: T; expiresAt?: Date | number }>
  ): Result<boolean> {
    this.db.transaction(() => {
      for (const entry of entries) {
        this.set(entry.key, entry.value, entry.expiresAt);
      }
    })();

    return {
      success: true,
      data: true,
    };
  }

  @SafeExecution
  multiDelete(keys: string[]): Result<number> {
    let totalDeletedRows = 0;
    this.db.transaction(() => {
      for (const k of keys) {
        const deleteResult = this.delete(k);
        if (deleteResult.success) {
          totalDeletedRows += deleteResult.data;
        }
      }
    })();

    return {
      success: true,
      data: totalDeletedRows,
    };
  }

  @SafeExecution
  vacuum(): Result<boolean> {
    this.statements.vacuum.run();

    return { success: true, data: true };
  }

  @SafeExecution
  close(): Result<boolean> {
    this.cleanup();
    this.db.close();

    return { success: true, data: true };
  }

  @SafeExecution
  cleanup(): Result<number> {
    const result = this.statements.cleanup.run(
      Date.now(),
      this.addNamespacePrefix("%")
    );

    return { success: true, data: result.changes };
  }

  @SafeExecution
  flush(): Result<number> {
    const result = this.statements.flush.run(this.addNamespacePrefix("%"));

    return { success: true, data: result.changes };
  }

  @SafeExecution
  async backup(path: string): Promise<void> {
    const serialized = this.db.serialize();
    const uint8Array = new Uint8Array(serialized);

    await writeFile(path, uint8Array);
  }

  @SafeExecution
  async restore(path: string) {
    const file = await readFile(path);

    this.db = new DB(file);

    this.statements = this.prepareStatements();
  }

  @SafeExecution
  execute(sql: string, params: unknown[] = []): Result<unknown[] | RunResult> {
    const stmt = this.db.prepare(sql);

    if (stmt.reader)
      return {
        success: true,
        data: stmt.all(...params),
      };

    return {
      success: true,
      data: stmt.run(...params),
    };
  }
}
