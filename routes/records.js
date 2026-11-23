const router = require("express").Router();
const pool = require("../db");

const VALID_STATUSES = ["Pending", "In progress", "Completed"];

function validateRecord(body) {
  const errors = [];
  const { title, category, description, status } = body;

  if (typeof title !== "string" || title.trim().length < 3 || title.trim().length > 80) {
    errors.push("Title must have 3 to 80 characters.");
  }
  if (typeof category !== "string" || category.trim().length < 2 || category.trim().length > 40) {
    errors.push("Category must have 2 to 40 characters.");
  }
  if (typeof description !== "string" || description.trim().length < 5 || description.trim().length > 300) {
    errors.push("Description must have 5 to 300 characters.");
  }
  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    errors.push("Status must be one of: Pending, In progress, Completed.");
  }
  return errors;
}

function isValidId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

// GET /api/records
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records ORDER BY id"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id
router.get("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "id must be a positive whole number." });
    }
    const result = await pool.query(
      "SELECT id, title, category, description, status FROM records WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records
router.post("/", async (req, res, next) => {
  try {
    const errors = validateRecord(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }
    const { title, category, description, status } = req.body;
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, description, status`,
      [title.trim(), category.trim(), description.trim(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id
router.put("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "id must be a positive whole number." });
    }
    const errors = validateRecord(req.body || {});
    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0] });
    }
    const { title, category, description, status } = req.body;
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5
       RETURNING id, title, category, description, status`,
      [title.trim(), category.trim(), description.trim(), status, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id
router.delete("/:id", async (req, res, next) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "id must be a positive whole number." });
    }
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Record not found." });
    }
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;