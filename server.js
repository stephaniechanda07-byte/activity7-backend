require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

const origins = (process.env.CLIENT_ORIGINS || "")
  .split(",").map(value => value.trim()).filter(Boolean);

app.use(cors({ origin: origins.length > 0 ? origins : "*" }));
app.use(express.json());

// ---------- GET / : API guide for the marker ----------
app.get("/", (req, res) => {
  res.status(200).send(`
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Campus Maintenance Requests API</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1b1f23; }
        h1 { color: #0d3d73; }
        code, pre { background: #f5f7fa; padding: 2px 6px; border-radius: 4px; }
        pre { padding: 12px; overflow-x: auto; }
        table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
        th, td { border: 1px solid #d7dde3; padding: 8px; text-align: left; }
        th { background: #0d3d73; color: white; }
      </style>
    </head>
    <body>
      <h1>Campus Maintenance Requests API</h1>
      <p><strong>Project:</strong> Campus Maintenance Requests</p>
      <p><strong>Student number:</strong> 202510778</p>
      <p>This API lets students and staff report broken lights, taps and furniture around campus.</p>

      <h2>Base URL</h2>
      <p><code>${req.protocol}://${req.get("host")}</code></p>
      <p>
        <a href="/health">/health</a> &mdash; check server and database<br>
        <a href="/api/records">/api/records</a> &mdash; read all records
      </p>

      <h2>Routes</h2>
      <table>
        <tr><th>Method</th><th>Route</th><th>Purpose</th></tr>
        <tr><td>GET</td><td>/</td><td>This guide</td></tr>
        <tr><td>GET</td><td>/health</td><td>Check server and database</td></tr>
        <tr><td>GET</td><td>/api/records</td><td>Read all records</td></tr>
        <tr><td>GET</td><td>/api/records/:id</td><td>Read one record</td></tr>
        <tr><td>POST</td><td>/api/records</td><td>Create a record</td></tr>
        <tr><td>PUT</td><td>/api/records/:id</td><td>Update a record</td></tr>
        <tr><td>DELETE</td><td>/api/records/:id</td><td>Delete a record</td></tr>
      </table>

      <h2>Fields</h2>
      <ul>
        <li><strong>title</strong> &mdash; text, 3 to 80 characters</li>
        <li><strong>category</strong> &mdash; text, 2 to 40 characters</li>
        <li><strong>description</strong> &mdash; text, 5 to 300 characters</li>
        <li><strong>status</strong> &mdash; one of: Pending, In progress, Completed</li>
      </ul>

      <h2>Example POST / PUT body</h2>
      <pre>{
  "title": "Broken classroom light",
  "category": "Electrical",
  "description": "The light in Room B12 does not switch on.",
  "status": "Pending"
}</pre>

      <h2>Status codes</h2>
      <ul>
        <li>200 &mdash; successful GET, PUT or DELETE</li>
        <li>201 &mdash; successful POST (record created)</li>
        <li>400 &mdash; invalid input or malformed JSON</li>
        <li>404 &mdash; record or route not found</li>
        <li>500 &mdash; unexpected server error</li>
        <li>503 &mdash; database not reachable (see /health)</li>
      </ul>
      <p><em>Note: on a free hosting plan, the service may sleep when idle. The first request after a pause can take up to a minute to respond.</em></p>
    </body>
    </html>
  `);
});

// ---------- GET /health ----------
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({ status: "error", message: "Database not reachable." });
  }
});

// ---------- Mount record routes ----------
app.use("/api/records", require("./routes/records"));

// ---------- Unknown route handler ----------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// ---------- Error handling middleware (4 params) ----------
app.use((error, req, res, next) => {
  console.error(error);
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON in request body." });
  }
  res.status(500).json({ message: "Unexpected server error." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});