import MiftahDB from "./miftahDB";
export default MiftahDB;

// Example usage
const db = new MiftahDB("test.db");

db.set("key2", "value", new Date(Date.now() + 60 * 1000));

console.log(db.get<string>("key2"));
console.log(db.get<string>("key"));

console.log(db.exists("key234234"));
console.log(db.exists("key2"));

db.close();
