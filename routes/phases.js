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
  const { title, phaseNo } = req.body;

  try {
    if (title) {
      const [titleResults] = await database.query('UPDATE phases SET title = ? WHERE id = ?', [title, id]);
      if (titleResults.affectedRows === 0) {
        return res.status(404).json({ message: "Phase not found." });
      }
    }

    if (phaseNo) {
      const [phaseNoResults] = await database.query('UPDATE phases SET phaseNo = ? WHERE id = ?', [phaseNo, id]);
      if (phaseNoResults.affectedRows === 0) {
        return res.status(404).json({ message: "Phase not found." });
      }
    }

    res.json({ message: "Phase updated successfully." });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to update phase." });
  }
});

router.post('/', async (req, res) => {
  const { phaseNo, title, profile_info } = req.body;

  try {
    const [results] = await database.query('INSERT INTO phases (phaseNo, title, profile_info) VALUES (?, ?, ?)', [phaseNo, title, profile_info]);
    res.status(201).json({ message: "Phase created successfully.", id: results.insertId });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ message: "Failed to create phase." });
  }
});

module.exports = router;
