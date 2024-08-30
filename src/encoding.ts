import msgpack from "msgpack-lite";
import { KeyValue } from "./types";

export function encodeValue(value: KeyValue): Buffer {
  if (Buffer.isBuffer(value)) {
    const marker = Buffer.from([0x01]);
    return Buffer.concat([marker, value]);
  } else {
    const marker = Buffer.from([0x02]);
    const msgPackedValue = msgpack.encode(value);
    return Buffer.concat([marker, msgPackedValue]);
  }
}

export function decodeValue<T>(buffer: Buffer): T | null {
  try {
    const marker = buffer.readUInt8(0);
    const actualValue = buffer.subarray(1);

    if (marker === 0x01) {
      return actualValue as T;
    } else if (marker === 0x02) {
      return msgpack.decode(actualValue) as T;
    } else {
      throw new Error("Unknown data marker.");
    }
  } catch (err) {
    console.error("Failed to decode value:", err);
    return null;
  }
}
