import DB, {
  type Database,
  type Statement,
  type RunResult,
} from "better-sqlite3";
import { writeFile, readFile } from "node:fs/promises";

import { SQL_STATEMENTS } from "./statements";
import { encodeValue, decodeValue } from "./encoding";
import { OK, SafeExecution, executeOnExit, expiresAtMs } from "./utils";

import { defaultDBOptions } from "./types";
import type {
  IMiftahDB,
  MiftahValue,
  MiftahDBItem,
  Result,
  PromiseResult,
  DBOptions,
} from "./types";

export abstract class BaseMiftahDB implements IMiftahDB {
  protected declare db: Database;
  protected statements: Record<string, Statement>;
  private readonly nameSpacePrefix: string | null = null;
  private readonly autoCleanupOnClose: boolean;

  constructor(path = ":memory:", options: DBOptions = defaultDBOptions) {
    this.initDatabase(path);

    const formattedPRAGMA = SQL_STATEMENTS.CREATE_PRAGMA.replace(
      "%journal_mode",
      options.journalMode ?? "WAL"
    )
      .replace("%synchronous_mode", options.synchronousMode ?? "NORMAL")
      .replace("%temp_store_mode", options.tempStoreMode ?? "MEMORY")
      .replace("%cache_size", options.cacheSize?.toString() ?? "-64000")
      .replace("%mmap_size", options.mmapSize?.toString() ?? "30000000000")
      .replace("%locking_mode", options.lockingMode ?? "NORMAL")
      .replace("%auto_vacuum_mode", options.autoVacuumMode ?? "OFF");

    this.db.exec(formattedPRAGMA);
    this.db.exec(SQL_STATEMENTS.CREATE_TABLE);
    this.db.exec(SQL_STATEMENTS.CREATE_INDEX);

    this.statements = this.prepareStatements();
    this.autoCleanupOnClose = options.autoCleanupOnClose ?? false;

    const autoCloseOnExit = options.autoCloseOnExit ?? true;
    if (autoCloseOnExit) executeOnExit(() => this.close());
  }

  protected prepareStatements(): Record<string, Statement> {
    return {
      get: this.db.prepare(SQL_STATEMENTS.GET),
      set: this.db.prepare(SQL_STATEMENTS.SET),
      exists: this.db.prepare(SQL_STATEMENTS.EXISTS),
      delete: this.db.prepare(SQL_STATEMENTS.DELETE),
      rename: this.db.prepare(SQL_STATEMENTS.RENAME),
      getExpire: this.db.prepare(SQL_STATEMENTS.GET_EXPIRE),
      persist: this.db.prepare(SQL_STATEMENTS.PERSIST),
      setExpire: this.db.prepare(SQL_STATEMENTS.SET_EXPIRE),
      keys: this.db.prepare(SQL_STATEMENTS.KEYS),
      pagination: this.db.prepare(SQL_STATEMENTS.PAGINATION),
      expiredRange: this.db.prepare(SQL_STATEMENTS.GET_EXPIRED_RANGE),
      cleanup: this.db.prepare(SQL_STATEMENTS.CLEANUP),
      countKeys: this.db.prepare(SQL_STATEMENTS.COUNT_KEYS),
      countExpired: this.db.prepare(SQL_STATEMENTS.COUNT_EXPIRED),
      vacuum: this.db.prepare(SQL_STATEMENTS.VACUUM),
      flush: this.db.prepare(SQL_STATEMENTS.FLUSH),
    };
  }

  protected abstract initDatabase(path: string | ":memory:"): void;

  protected beforeClose(): void {
    this.vacuum();
    if (this.autoCleanupOnClose) this.cleanup();
  }

  private addNamespacePrefix(k: string): string {
    return this.nameSpacePrefix ? `${this.nameSpacePrefix}:${k}` : k;
  }

  private removeNamespacePrefix(key: string): string {
    return this.nameSpacePrefix && key.startsWith(`${this.nameSpacePrefix}:`)
      ? key.slice(this.nameSpacePrefix.length + 1)
      : key;
  }

  private _modifyNumericValue(
    key: string,
    amount: number,
    operation: "increment" | "decrement"
  ): Result<number> {
    const prefixedKey = this.addNamespacePrefix(key);
    let newValue: number;

    try {
      const transaction = this.db.transaction(() => {
        const getResult = this.statements.get.get(
          prefixedKey
        ) as MiftahDBItem | null;
        let currentValue: number;
        let expiresAt: number | null = null;

        if (getResult) {
          // Key exists
          if (getResult.expires_at && getResult.expires_at <= Date.now()) {
            // Key has expired, treat as non-existent for inc/dec logic
            currentValue = 0;
            // When setting new value, it won't have an expiration unless explicitly set later
          } else {
            const decoded = decodeValue(getResult.value);
            if (typeof decoded !== "number" || isNaN(decoded)) {
              throw new Error(
                `Value for key "${this.removeNamespacePrefix(
                  prefixedKey
                )}" is not a number.`
              );
            }
            currentValue = decoded;
            expiresAt = getResult.expires_at; // Preserve original expiration
          }
        } else {
          currentValue = 0;
        }

        if (operation === "increment") {
          newValue = currentValue + amount;
        } else {
          // decrement
          newValue = currentValue - amount;
        }

        const setOpResult = this.statements.set.run(
          prefixedKey,
          encodeValue(newValue),
          expiresAt
        );

        if (setOpResult.changes === 0 && getResult) {
          throw new Error("Failed to update the key during numeric operation.");
        }
      });

      transaction(); // Execute the transaction

      // @ts-ignore newValue will be assigned if transaction is successful
      return OK(newValue);
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  namespace(name: string): IMiftahDB {
    const namespacedDB = Object.create(this);
    namespacedDB.nameSpacePrefix = this.nameSpacePrefix
      ? `${this.nameSpacePrefix}:${name}`
      : name;

    return namespacedDB;
  }

  @SafeExecution
  increment(key: string, amount = 1): Result<number> {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("Increment amount must be a valid number.");
    }

    return this._modifyNumericValue(key, amount, "increment");
  }

  @SafeExecution
  decrement(key: string, amount = 1): Result<number> {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("Decrement amount must be a valid number.");
    }

    return this._modifyNumericValue(key, amount, "decrement");
  }

  @SafeExecution
  get<T>(key: string): Result<T> {
    const prefixedKey = this.addNamespacePrefix(key);
    const result = this.statements.get.get(prefixedKey) as MiftahDBItem | null;

    if (!result) throw Error("Key not found, cannot get.");
    if (result.expires_at && result.expires_at <= Date.now()) {
      this.delete(prefixedKey);
      throw new Error("Key expired, cannot get.");
    }

    const value = decodeValue(result.value) as T;
    return OK(value);
  }

  @SafeExecution
  set<T extends MiftahValue>(
    key: string,
    value: T,
    expiresAt?: Date | number
  ): Result<boolean> {
    const prefixedKey = this.addNamespacePrefix(key);
    this.statements.set.run(
      prefixedKey,
      encodeValue(value),
      expiresAtMs(expiresAt)
    );

    return OK();
  }

  @SafeExecution
  exists(key: string): Result<boolean> {
    const prefixedKey = this.addNamespacePrefix(key);
    const result = this.statements.exists.get(prefixedKey) as {
      [key: string]: number;
    };
    const doExists = Boolean(Object.values(result)[0]);
    if (!doExists) throw Error("Key not found, cannot check exists.");

    return OK(doExists);
  }

  @SafeExecution
  delete(key: string): Result<number> {
    const result = this.statements.delete.run(this.addNamespacePrefix(key));

    return OK(result.changes);
  }

  @SafeExecution
  rename(oldKey: string, newKey: string): Result<boolean> {
    this.statements.rename.run(
      this.addNamespacePrefix(newKey),
      this.addNamespacePrefix(oldKey)
    );

    return OK();
  }

  @SafeExecution
  setExpire(key: string, expiresAt: Date | number): Result<boolean> {
    this.statements.setExpire.run(
      expiresAtMs(expiresAt),
      this.addNamespacePrefix(key)
    );

    return OK();
  }

  @SafeExecution
  getExpire(key: string): Result<Date> {
    const prefixedKey = this.addNamespacePrefix(key);
    const result = this.statements.getExpire.get(prefixedKey) as {
      expires_at: number | null;
    } | null;

    if (!result) throw Error("Key not found, cannot getExpire.");
    if (!result.expires_at)
      throw Error("Key has no expiration, cannot getExpire.");

    const expiresAt = new Date(result.expires_at);

    return OK(expiresAt);
  }

  @SafeExecution
  ttl(key: string): Result<number | null> {
    const prefixedKey = this.addNamespacePrefix(key);
    const result = this.statements.getExpire.get(prefixedKey) as {
      expires_at: number | null;
    } | null;

    if (!result) {
      throw new Error("Key not found, cannot ttl.");
    }

    if (result.expires_at === null) {
      return OK(null);
    }

    const now = Date.now();
    if (result.expires_at <= now) {
      this.delete(prefixedKey);
      throw new Error("Key expired, cannot ttl.");
    }

    return OK(result.expires_at - now);
  }

  @SafeExecution
  persist(key: string): Result<boolean> {
    const prefixedKey = this.addNamespacePrefix(key);
    const existsCheck = this.statements.exists.get(prefixedKey) as {
      [key: string]: number;
    };

    if (!Object.values(existsCheck)[0]) {
      throw new Error("Key not found, cannot persist.");
    }

    this.statements.persist.run(prefixedKey);

    return OK(true);
  }

  @SafeExecution
  keys(pattern = "%"): Result<string[]> {
    const prefixedKey = this.addNamespacePrefix(pattern);
    const result = this.statements.keys.all(prefixedKey) as {
      key: string;
    }[];

    if (result.length === 0) throw Error("No keys found, cannot get keys.");
    const resultArray = result.map((r) => this.removeNamespacePrefix(r.key));

    return OK(resultArray);
  }

  @SafeExecution
  pagination(limit: number, page: number, pattern = "%"): Result<string[]> {
    const prefixedKey = this.addNamespacePrefix(pattern);
    const offset = (page - 1) * limit;
    const result = this.statements.pagination.all(
      prefixedKey,
      limit,
      offset
    ) as { key: string }[];

    if (result.length === 0)
      throw Error("No keys found, cannot get pagination.");
    const resultArray = result.map((r) => this.removeNamespacePrefix(r.key));

    return OK(resultArray);
  }

  @SafeExecution
  expiredRange(
    start: Date | number,
    end: Date | number,
    pattern = "%"
  ): Result<string[]> {
    const prefixedKey = this.addNamespacePrefix(pattern);
    const startDate = expiresAtMs(start);
    const endDate = expiresAtMs(end);
    const result = this.statements.expiredRange.all(
      prefixedKey,
      startDate,
      endDate
    ) as { key: string }[];

    if (result.length === 0)
      throw Error("No keys found, cannot get expiredRange.");
    const resultArray = result.map((r) => this.removeNamespacePrefix(r.key));

    return OK(resultArray);
  }

  @SafeExecution
  count(pattern = "%"): Result<number> {
    const prefixedKey = this.addNamespacePrefix(pattern);
    const result = this.statements.countKeys.get(prefixedKey) as {
      count: number;
    };

    return OK(result.count);
  }

  @SafeExecution
  countExpired(pattern = "%"): Result<number> {
    const prefixedKey = this.addNamespacePrefix(pattern);
    const result = this.statements.countExpired.get(
      Date.now(),
      prefixedKey
    ) as {
      count: number;
    };

    return OK(result.count);
  }

  @SafeExecution
  multiGet<T>(keys: string[]): Result<T[]> {
    if (keys.length === 0) throw Error("No keys provided, cannot multiGet.");

    const result: Record<string, T> = {};
    this.db.transaction(() => {
      for (const k of keys) {
        const value = this.get<T>(k);
        if (value.success) result[this.removeNamespacePrefix(k)] = value.data;
      }
    })();

    const resultArray = Object.values(result);
    if (resultArray.length === 0)
      throw Error("No keys found, cannot multiGet.");

    return OK(resultArray);
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

    return OK();
  }

  @SafeExecution
  multiDelete(keys: string[]): Result<number> {
    if (keys.length === 0) throw Error("No keys provided, cannot multiDelete.");

    let totalDeletedRows = 0;
    this.db.transaction(() => {
      for (const k of keys) {
        const deleteResult = this.delete(k);
        if (deleteResult.success) {
          totalDeletedRows += deleteResult.data;
        }
      }
    })();

    return OK(totalDeletedRows);
  }

  @SafeExecution
  vacuum(): Result<boolean> {
    this.statements.vacuum.run();

    return OK();
  }

  @SafeExecution
  close(): Result<boolean> {
    this.beforeClose();
    this.db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    this.db.close();

    return OK();
  }

  @SafeExecution
  cleanup(): Result<number> {
    const result = this.statements.cleanup.run(
      Date.now(),
      this.addNamespacePrefix("%")
    );

    return OK(result.changes);
  }

  @SafeExecution
  flush(): Result<number> {
    const result = this.statements.flush.run(this.addNamespacePrefix("%"));

    return OK(result.changes);
  }

  @SafeExecution
  async backup(path: string): PromiseResult<boolean> {
    const serialized = this.db.serialize();
    const uint8Array = new Uint8Array(serialized);

    await writeFile(path, uint8Array);

    return OK();
  }

  @SafeExecution
  async restore(path: string): PromiseResult<boolean> {
    const file = await readFile(path);

    this.db = new DB(file);
    this.statements = this.prepareStatements();

    return OK();
  }

  @SafeExecution
  execute(sql: string, params: unknown[] = []): Result<unknown[] | RunResult> {
    const stmt = this.db.prepare(sql);

    if (stmt.reader) {
      const result = stmt.all(...params);
      return OK(result);
    }

    const result = stmt.run(...params);
    return OK(result);
  }
}
