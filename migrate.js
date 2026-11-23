require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function run() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await pool.query(schema);
    console.log("Schema created (or already existed).");

    const countResult = await pool.query("SELECT COUNT(*) FROM records");
    const existingCount = Number(countResult.rows[0].count);

    if (existingCount === 0) {
      const seed = fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8");
      await pool.query(seed);
      console.log("Seed data inserted.");
    } else {
      console.log(`Table already has ${existingCount} records. Skipping seed.`);
    }
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

run();
