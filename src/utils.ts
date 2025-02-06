import type { Result } from "./types";

export function SafeExecution<T extends (...args: unknown[]) => R, R>(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: Parameters<T>): Result<ReturnType<T>> {
    try {
      const result = originalMethod.apply(this, args);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  };

  return descriptor;
}

export function getExpireDate(expiresAt: number | Date | undefined) {
  let expiresAtMs: number | undefined = undefined;
  if (expiresAt) {
    if (typeof expiresAt === "number") {
      expiresAtMs = new Date().getTime() + expiresAt;
    } else {
      expiresAtMs = expiresAt.getTime();
    }
  }

  return expiresAtMs;
}

const SIGNALS = ["SIGINT", "SIGTERM", "SIGQUIT", "exit"];

export function executeOnExit(fn: () => void) {
  for (const signal of SIGNALS) {
    process.on(signal, () => {
      console.log(fn());
      process.exit(0);
    });
  }

  process.on("uncaughtException", (error) => {
    console.error(error);
    fn();
    process.exit(1);
  });

  process.on("unhandledRejection", (error) => {
    console.error(error);
    fn();
    process.exit(1);
  });
}
