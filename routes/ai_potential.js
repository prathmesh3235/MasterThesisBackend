const express = require('express');
const database = require('../utils/database');
const { authenticate } = require('../utils/tokens');
const router = express.Router();

// Get all potentials for a specific phase with current rating
router.get('/:phaseId', async (req, res) => {
  const { phaseId } = req.params;
  try {
    const [results] = await database.query(
      `SELECT 
        p.id, 
        p.phaseId, 
        p.category, 
        p.title, 
        p.description, 
        pr.rating,
        pr.user_id as ratedBy
       FROM potential p
       LEFT JOIN potential_ratings pr ON pr.potential_id = p.id
       AND pr.id = (
         SELECT pr2.id FROM potential_ratings pr2
         WHERE pr2.potential_id = p.id
         ORDER BY pr2.created_at DESC LIMIT 1
       )
       WHERE p.phaseId = ?
       ORDER BY p.category, p.title`,
      [phaseId]
    );
    res.json(results);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve potentials.",
      error: error.message 
    });
  }
});

// Get a specific potential by ID
router.get('/detail/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await database.query(
      `SELECT 
        p.*, 
        pr.rating,
        pr.user_id as ratedBy
       FROM potential p
       LEFT JOIN potential_ratings pr ON pr.potential_id = p.id
       AND pr.id = (
         SELECT pr2.id FROM potential_ratings pr2
         WHERE pr2.potential_id = p.id
         ORDER BY pr2.created_at DESC LIMIT 1
       )
       WHERE p.id = ?`,
      [id]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }

    res.json(results[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve potential.",
      error: error.message 
    });
  }
});

// Add a new potential
router.post('/', authenticate, async (req, res) => {
  const { phaseId, category, title, description } = req.body;

  // Validate required fields
  if (!phaseId || !category || !title || !description) {
    return res.status(400).json({ 
      message: "Missing required fields. Please provide phaseId, category, title, and description." 
    });
  }

  try {
    const [results] = await database.query(
      'INSERT INTO potential (phaseId, category, title, description) VALUES (?, ?, ?, ?)',
      [phaseId, category, title, description]
    );
    
    res.status(201).json({
      message: "Potential created successfully.",
      id: results.insertId,
      potential: {
        id: results.insertId,
        phaseId,
        category,
        title,
        description
      }
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to create potential.",
      error: error.message 
    });
  }
});

// Update a potential
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { category, title, description } = req.body;

  // Validate at least one field is provided for update
  if (!category && !title && !description) {
    return res.status(400).json({ 
      message: "No update fields provided. Please provide at least one of: category, title, or description." 
    });
  }

  try {
    // Build dynamic update query based on provided fields
    const updates = [];
    const values = [];
    if (category) {
      updates.push('category = ?');
      values.push(category);
    }
    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    values.push(id);

    const [results] = await database.query(
      `UPDATE potential SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }

    // Fetch and return updated potential
    const [updated] = await database.query('SELECT * FROM potential WHERE id = ?', [id]);
    res.json({
      message: "Potential updated successfully.",
      potential: updated[0]
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to update potential.",
      error: error.message 
    });
  }
});

// Delete a potential
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    // First check if potential exists
    const [potential] = await database.query(
      'SELECT id FROM potential WHERE id = ?',
      [id]
    );

    if (potential.length === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }

    // Delete the potential
    await database.query('DELETE FROM potential WHERE id = ?', [id]);

    res.json({ 
      message: "Potential deleted successfully.",
      deletedId: id 
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to delete potential.",
      error: error.message 
    });
  }
});

// Update rating for a potential
router.patch('/:id/rating', authenticate, async (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  const userId = req.userId;

  // Validate rating value
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ 
      message: "Invalid rating. Please provide a rating between 1 and 5." 
    });
  }

  try {
    // First check if potential exists
    const [potential] = await database.query(
      'SELECT id FROM potential WHERE id = ?',
      [id]
    );

    if (potential.length === 0) {
      return res.status(404).json({ message: "Potential not found." });
    }

    // Upsert the rating
    await database.query(
      `INSERT INTO potential_ratings (potential_id, user_id, rating) 
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [id, userId, rating]
    );

    res.json({ 
      message: "Rating updated successfully.",
      rating: rating,
      potentialId: id,
      userId: userId
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ 
      message: "Failed to update rating.",
      error: error.message 
    });
  }
});

// Get top-rated potentials across ALL phases
router.get('/top-rated/all', async (req, res) => {
  try {
    // For "most recent" single rating, we do similar logic with a LEFT JOIN and subquery:
    const [results] = await database.query(`
    SELECT 
    p.id, 
    p.phaseId, 
    p.category, 
    p.title, 
    p.description, 
    pr.rating,
    pr.user_id AS ratedBy,
    ph.phaseNo,
    ph.title AS phaseTitle
  FROM potential p
  LEFT JOIN phases ph ON ph.id = p.phaseId
  LEFT JOIN potential_ratings pr ON pr.potential_id = p.id
    AND pr.id = (
      SELECT pr2.id FROM potential_ratings pr2
      WHERE pr2.potential_id = p.id
      ORDER BY pr2.created_at DESC LIMIT 1
    )
  ORDER BY pr.rating DESC;
    `);

    // to display only potentials that have a rating, filter out null rating:
    const filtered = results.filter(r => r.rating !== null);

    res.json(filtered); 
  } catch (error) {
    console.error("Database error (top-rated):", error);
    res.status(500).json({
      message: "Failed to retrieve top-rated potentials.",
      error: error.message
    });
  }
});


module.exports = router;