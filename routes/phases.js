const express = require('express');
const database = require('../utils/database');

// Create a router object
const router = express.Router();

// Endpoint to get all phases
router.get('/', async (req, res) => {
  try {
    const [results] = await database.query('SELECT * FROM phases');
    res.json(results);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to retrieve phases." });
  }
});

// Endpoint to get a specific phase by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await database.query('SELECT * FROM phases WHERE id = ?', [id]);
    if (results.length === 0) {
      return res.status(404).json({ message: "Phase not found." });
    }
    res.json(results[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to retrieve phase." });
  }
});

// Endpoint to update the title of a specific phase by ID
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  try {
    const [results] = await database.query('UPDATE phases SET title = ? WHERE id = ?', [title, id]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Phase not found." });
    }
    res.json({ message: "Phase title updated successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to update phase title." });
  }
});

module.exports = router;
