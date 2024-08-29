export type KeyValue = string | number | boolean | object | Buffer | null;

export interface IMiftahDB {
  get<T>(key: string): T | null;
  set<T extends KeyValue>(key: string, value: T, expiresAt?: Date): void;
  delete(key: string): void;
  rename(oldKey: string, newKey: string): void;
  vacuum(): void;
  close(): void;
  flush(): void;
}

export interface MiftahDBItem {
  value: Buffer;
  expires_at: number | null;
}
