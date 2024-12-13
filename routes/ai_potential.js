// backend/routes/ai_potential.js

const express = require('express');
const database = require('../utils/database');
const { authenticate, adminOnly } = require('../utils/tokens');
const router = express.Router();

// Get all potentials for a specific phase with current rating
router.get('/:phaseId', async (req, res) => {
  const { phaseId } = req.params;
  try {
    const [results] = await database.query(
      `SELECT p.id, p.phaseId, p.category, p.title, p.description, pr.rating
       FROM potential p
       LEFT JOIN potential_ratings pr ON pr.potential_id = p.id
       AND pr.id = (
         SELECT pr2.id FROM potential_ratings pr2
         WHERE pr2.potential_id = p.id
         ORDER BY pr2.created_at DESC LIMIT 1
       )
       WHERE p.phaseId = ?`,
      [phaseId]
    );
    res.json(results);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to retrieve potentials." });
  }
});

// Add a new potential
router.post('/', async (req, res) => {
  const { phaseId, category, title, description } = req.body;
  try {
    const [results] = await database.query(
      'INSERT INTO potential (phaseId, category, title, description) VALUES (?, ?, ?, ?)',
      [phaseId, category, title, description]
    );
    res.status(201).json({
      message: "Potential created successfully.",
      id: results.insertId
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to create potential." });
  }
});

// Update a potential
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { category, title, description } = req.body;
  try {
    const [results] = await database.query(
      'UPDATE potential SET category = ?, title = ?, description = ? WHERE id = ?',
      [category, title, description, id]
    );
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }
    res.json({ message: "Potential updated successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to update potential." });
  }
});

// Delete a potential
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await database.query(
      'DELETE FROM potential WHERE id = ?',
      [id]
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }

    res.json({ message: "Potential deleted successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to delete potential." });
  }
});

// Set/Update rating (admin only)
router.post('/:id/rating', authenticate, adminOnly, async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.userId;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5." });
  }

  try {
    await database.query(
      `INSERT INTO potential_ratings (potential_id, rating, user_id) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [id, rating, userId]
    );
    res.json({ message: "Rating saved successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to save rating." });
  }
});

module.exports = router;
