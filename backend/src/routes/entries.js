import express from "express";
import { dbRun, dbGet, dbAll } from "../db/database.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all entries for the authenticated user
router.get("/", async (req, res) => {
  try {
    console.log("📊 Fetching entries for user:", req.user.id, req.user.email);
    const entries = await dbAll(
      `
			SELECT
				e.*,
				u.name as feeder_name
			FROM feeding_entries e
			JOIN users u ON e.user_id = u.id
			WHERE e.user_id = ?
			ORDER BY e.fed_at DESC
			LIMIT 1000
		`,
      [req.user.id],
    );

    console.log("📊 Found", entries.length, "entries");
    res.json(entries);
  } catch (error) {
    console.error("Error fetching entries:", error);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

// Get entries with date filter
router.get("/filter", async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    let query = `
			SELECT
				e.*,
				u.name as feeder_name
			FROM feeding_entries e
			JOIN users u ON e.user_id = u.id
			WHERE 1=1
		`;
    const params = [];

    if (startDate) {
      query += " AND e.fed_at >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND e.fed_at <= ?";
      params.push(endDate);
    }

    if (type && (type === "food" || type === "milk")) {
      query += " AND e.type = ?";
      params.push(type);
    }

    query += " ORDER BY e.fed_at DESC";

    const entries = await dbAll(query, params);
    res.json(entries);
  } catch (error) {
    console.error("Error filtering entries:", error);
    res.status(500).json({ error: "Failed to filter entries" });
  }
});

// Get statistics
router.get("/stats", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await dbAll(
      `
			SELECT
				DATE(fed_at) as date,
				type,
				SUM(quantity_ml) as total_ml,
				COUNT(*) as count
			FROM feeding_entries
			WHERE fed_at >= ?
			GROUP BY DATE(fed_at), type
			ORDER BY date DESC
		`,
      [startDate.toISOString()],
    );

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Create new entry
router.post("/", async (req, res) => {
  try {
    const { type, quantity_ml, fed_at, notes } = req.body;

    // Validation
    if (!type || !quantity_ml || !fed_at) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (type !== "food" && type !== "milk") {
      return res
        .status(400)
        .json({ error: 'Invalid type. Must be "food" or "milk"' });
    }

    if (quantity_ml <= 0 || quantity_ml > 10000) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const result = await dbRun(
      `INSERT INTO feeding_entries (user_id, type, quantity_ml, fed_at, notes) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, type, quantity_ml, fed_at, notes || null],
    );

    const entry = await dbGet(
      `
			SELECT
				e.*,
				u.name as feeder_name
			FROM feeding_entries e
			JOIN users u ON e.user_id = u.id
			WHERE e.id = ?
		`,
      [result.lastID],
    );

    res.status(201).json(entry);
  } catch (error) {
    console.error("Error creating entry:", error);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

// Update entry
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity_ml, fed_at, notes } = req.body;

    // Check if entry exists
    const existing = await dbGet("SELECT * FROM feeding_entries WHERE id = ?", [
      id,
    ]);

    if (!existing) {
      return res.status(404).json({ error: "Entry not found" });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (type) {
      if (type !== "food" && type !== "milk") {
        return res.status(400).json({ error: "Invalid type" });
      }
      updates.push("type = ?");
      params.push(type);
    }

    if (quantity_ml !== undefined) {
      if (quantity_ml <= 0 || quantity_ml > 10000) {
        return res.status(400).json({ error: "Invalid quantity" });
      }
      updates.push("quantity_ml = ?");
      params.push(quantity_ml);
    }

    if (fed_at) {
      updates.push("fed_at = ?");
      params.push(fed_at);
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      params.push(notes);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    if (updates.length === 1) {
      // Only updated_at
      return res.status(400).json({ error: "No fields to update" });
    }

    params.push(id);

    await dbRun(
      `UPDATE feeding_entries SET ${updates.join(", ")} WHERE id = ?`,
      params,
    );

    const entry = await dbGet(
      `
			SELECT
				e.*,
				u.name as feeder_name
			FROM feeding_entries e
			JOIN users u ON e.user_id = u.id
			WHERE e.id = ?
		`,
      [id],
    );

    res.json(entry);
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete entry
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await dbGet("SELECT * FROM feeding_entries WHERE id = ?", [
      id,
    ]);

    if (!existing) {
      return res.status(404).json({ error: "Entry not found" });
    }

    await dbRun("DELETE FROM feeding_entries WHERE id = ?", [id]);

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting entry:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

export default router;
