const express = require("express");
const database = require("../utils/database");
const { authenticate } = require("../utils/tokens");
const router = express.Router();

// Get all subphases for a specific phase
router.get("/:phaseId/subphases", async (req, res) => {
  try {
    const [subphases] = await database.query(
      `
            SELECT s.*, GROUP_CONCAT(sd.detail ORDER BY sd.order_number) as details
            FROM subphases s
            LEFT JOIN subphase_details sd ON s.id = sd.subphase_id
            WHERE s.phase_id = ?
            GROUP BY s.id
            ORDER BY s.order_number
        `,
      [req.params.phaseId]
    );

    const formattedSubphases = subphases.map((subphase) => ({
      ...subphase,
      details: subphase.details ? subphase.details.split(",") : [],
    }));

    res.json(formattedSubphases);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to retrieve subphases" });
  }
});

// Create new subphase
router.post("/:phaseId/subphases", authenticate, async (req, res) => {
  const { name, details } = req.body;
  const { phaseId } = req.params;
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Get current max order
    const [maxOrder] = await connection.query(
      "SELECT MAX(order_number) as maxOrder FROM subphases WHERE phase_id = ?",
      [phaseId]
    );
    const newOrderNumber = (maxOrder[0].maxOrder || 0) + 1;

    // Insert subphase
    const [subphaseResult] = await connection.query(
      "INSERT INTO subphases (phase_id, name, order_number) VALUES (?, ?, ?)",
      [phaseId, name, newOrderNumber]
    );

    // Insert details if provided
    if (details && Array.isArray(details)) {
      const detailValues = details.map((detail, index) => [
        subphaseResult.insertId,
        detail,
        index + 1,
      ]);

      if (detailValues.length > 0) {
        await connection.query(
          "INSERT INTO subphase_details (subphase_id, detail, order_number) VALUES ?",
          [detailValues]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      message: "Subphase created successfully",
      id: subphaseResult.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to create subphase" });
  } finally {
    connection.release();
  }
});

// Update subphase
router.patch("/:phaseId/subphases/:id", authenticate, async (req, res) => {
  const { name, details } = req.body;
  const { id, phaseId } = req.params;
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Verify subphase belongs to phase
    const [subphase] = await connection.query(
      "SELECT id FROM subphases WHERE id = ? AND phase_id = ?",
      [id, phaseId]
    );

    if (!subphase.length) {
      throw new Error("Subphase not found");
    }

    // Update subphase name
    await connection.query("UPDATE subphases SET name = ? WHERE id = ?", [
      name,
      id,
    ]);

    // Update details
    await connection.query(
      "DELETE FROM subphase_details WHERE subphase_id = ?",
      [id]
    );

    if (details && Array.isArray(details)) {
      const detailValues = details.map((detail, index) => [
        id,
        detail,
        index + 1,
      ]);

      if (detailValues.length > 0) {
        await connection.query(
          "INSERT INTO subphase_details (subphase_id, detail, order_number) VALUES ?",
          [detailValues]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Subphase updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to update subphase" });
  } finally {
    connection.release();
  }
});

// Delete subphase
router.delete("/:phaseId/subphases/:id", authenticate, async (req, res) => {
  const { id, phaseId } = req.params;
  const connection = await database.getConnection();

  try {
    await connection.beginTransaction();

    // Verify subphase belongs to phase
    const [subphase] = await connection.query(
      "SELECT id FROM subphases WHERE id = ? AND phase_id = ?",
      [id, phaseId]
    );

    if (!subphase.length) {
      throw new Error("Subphase not found");
    }

    // Delete subphase details first
    await connection.query(
      "DELETE FROM subphase_details WHERE subphase_id = ?",
      [id]
    );

    // Delete subphase
    await connection.query("DELETE FROM subphases WHERE id = ?", [id]);

    // Reorder remaining subphases
    await connection.query(
      `
    UPDATE subphases s
    JOIN (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
        FROM subphases
        WHERE phase_id = ?
    ) as t ON s.id = t.id
    SET s.order_number = t.new_order;
`,
      [phaseId]
    );

    await connection.commit();
    res.json({ message: "Subphase deleted successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to delete subphase" });
  } finally {
    connection.release();
  }
});

module.exports = router;
