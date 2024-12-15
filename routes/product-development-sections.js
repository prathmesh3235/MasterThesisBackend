const express = require('express');
const router = express.Router();
const pool = require('../utils/database');

// GET route for fetching sections
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        section_title,
        content,
        reference_text,
        icon_name
      FROM product_development_sections
      ORDER BY id ASC
    `;
    
    const [rows] = await pool.query(query);
    res.json(rows);
    
  } catch (error) {
    console.error('Error fetching product development sections:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PATCH route for updating sections
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { section_title, content, reference_text } = req.body;
  
  try {
    // First update the record
    const updateQuery = `
      UPDATE product_development_sections
      SET 
        section_title = ?,
        content = ?,
        reference_text = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [updateResult] = await pool.query(updateQuery, [
      section_title,
      content,
      reference_text,
      id
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }

    // Fetch the updated record
    const selectQuery = `
      SELECT 
        id,
        section_title,
        content,
        reference_text,
        icon_name,
        updated_at
      FROM product_development_sections
      WHERE id = ?
    `;

    const [rows] = await pool.query(selectQuery, [id]);
    
    res.json({ 
      message: 'Section updated successfully', 
      section: rows[0]
    });
    
  } catch (error) {
    console.error('Error updating product development section:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;