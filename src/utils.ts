import type { Result } from "./types";

// Decorator to safely execute a method and return a result type
export function SafeExecution<T extends (...args: unknown[]) => R, R>(
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: Parameters<T>): Result<ReturnType<T>> {
    try {
      return originalMethod.apply(this, args);
    } catch (error) {
      return ERR(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return descriptor;
}

// Converts an expiresAt value to a number of milliseconds
export function expiresAtMs(expiresAt: number | Date | undefined) {
  let result: number | undefined = undefined;

  if (expiresAt) {
    if (typeof expiresAt === "number") {
      result = new Date().getTime() + expiresAt;
    } else {
      result = expiresAt.getTime();
    }
  }

  return result;
}

// Executes a function when the process receives exit signals
export function executeOnExit(fn: () => void) {
  for (const signal of ["SIGINT", "SIGTERM", "SIGQUIT", "exit"]) {
    process.on(signal, () => {
      fn();
      process.exit(0);
    });
  }
}

export function OK<T>(data: T): Result<T> {
  return { success: true, data };
}

function ERR<T>(error: Error): Result<T> {
  return { success: false, error };
}
