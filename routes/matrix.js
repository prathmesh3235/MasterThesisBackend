const express = require('express');
const database = require('../utils/database');
const { authenticate } = require('../utils/tokens');
const router = express.Router();

// Get matrix data for a specific phase
router.get('/phase/:phaseId', async (req, res) => {
    const { phaseId } = req.params;
    try {
        const [categories] = await database.query(
            `SELECT * FROM matrix_categories WHERE phase_id = ?`,
            [phaseId]
        );

        const groupedCategories = categories.reduce((acc, item) => {
            if (!acc[item.category_type]) {
                acc[item.category_type] = [];
            }
            acc[item.category_type].push(item);
            return acc;
        }, {});

        res.json({ categories: groupedCategories });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to retrieve matrix data.' });
    }
});

// Update matrix category (admin only)
router.patch('/categories/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, description, detail_text } = req.body;
    try {
        await database.query(
            `UPDATE matrix_categories 
             SET title = ?, description = ?, detail_text = ?
             WHERE id = ?`,
            [title, description, detail_text, id]
        );
        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to update category.' });
    }
});

// Delete matrix category (admin only)
router.delete('/categories/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    try {
        await database.query('DELETE FROM matrix_categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to delete category.' });
    }
});

// Add new matrix category (admin only)
router.post('/categories', authenticate, async (req, res) => {
    const { phase_id, category_type, title, description, detail_text } = req.body;
    try {
        const [result] = await database.query(
            `INSERT INTO matrix_categories 
             (phase_id, category_type, title, description, detail_text) 
             VALUES (?, ?, ?, ?, ?)`,
            [phase_id, category_type, title, description, detail_text]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to create category.' });
    }
});

module.exports = router;