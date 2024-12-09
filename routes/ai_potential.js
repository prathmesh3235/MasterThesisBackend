const express = require('express');
const database = require('../utils/database');
const router = express.Router();

// Get all potentials for a specific phase
router.get('/:phaseId', async (req, res) => {
  const { phaseId } = req.params;
  try {
    const [results] = await database.query(
      'SELECT * FROM potential WHERE phaseId = ?',
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

module.exports = router;