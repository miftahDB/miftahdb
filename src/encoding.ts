import msgpack from "msgpack-lite";

import type { MiftahValue } from "./types";

// Concatenates multiple Uint8Arrays into a single Uint8Array
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

// Encodes a value into a Uint8Array
export function encodeValue(value: MiftahValue): Uint8Array {
  if (value instanceof Uint8Array) {
    const marker = new Uint8Array([0x01]); // Uint8Array
    return concatUint8Arrays([marker, value]);
  }

  if (Buffer.isBuffer(value)) {
    // Check for Node.js Buffer
    const marker = new Uint8Array([0x03]); // Buffer
    return concatUint8Arrays([marker, value]); // value is already Uint8Array-like
  }

  const marker = new Uint8Array([0x02]); // Msgpack
  const msgPackedValue = msgpack.encode(value);
  return concatUint8Arrays([marker, msgPackedValue]);
}

// Decodes a value from a Uint8Array
export function decodeValue<T>(buffer: Uint8Array): T | null {
  try {
    const marker = buffer[0];
    const actualValue = buffer.subarray(1);

    if (marker === 0x01) return actualValue as T; // Uint8Array
    if (marker === 0x03) return Buffer.from(actualValue) as T; // Node.js Buffer
    if (marker === 0x02) return msgpack.decode(actualValue) as T; // Msgpack

    throw new Error("Unknown data marker.");
  } catch (err) {
    console.error("Failed to decode value:", err);
    return null;
  }
}
