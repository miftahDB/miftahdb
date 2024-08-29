import MiftahDB from "./miftahDB";
export default MiftahDB;

// Example usage
const db = new MiftahDB("test.db");

db.set("key2", "value", new Date(Date.now() + 60 * 1000));

console.log(db.get<string>("key"));

db.set("string", "Hello, World!");
db.set("number", 42);
db.set("float", 3.14);
db.set("boolean", true);
db.set("binary", Buffer.from([0x01, 0x02, 0x03]));
db.set("array", [1, 2, 3, "four"]);
db.set("object", { name: "Alice", age: 30 });
db.set("null", null);

// Try retrieving data
console.log(db.get<string>("string")); // "Hello, World!"
console.log(db.get<number>("number")); // 42
console.log(db.get<number>("float")); // 3.14
console.log(db.get<boolean>("boolean")); // true
console.log(db.get<Buffer>("binary")); // <Buffer 01 02 03>
console.log(db.get<any[]>("array")); // [1, 2, 3, "four"]
console.log(db.get<{ name: string; age: number }>("object")); // { name: "Alice", age: 30 }
console.log(db.get<any>("null")); // null

db.close();
