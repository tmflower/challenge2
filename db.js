const { Client } = require("pg");

function getDatabaseUri() {
    return (process.env.NODE_ENV === "test")
    ? "challenge2_test"
    : process.env.DATABASE_URL || "challenge2";
}

let db = new Client({
    connectionString: getDatabaseUri()
});

db.connect();

module.exports = db;