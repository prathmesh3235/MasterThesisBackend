const express = require('express');
const router = express.Router();
const database = require('../utils/database');
const { authenticate } = require('../utils/tokens');


// Get complete profile data for a phase
// Get complete profile data for a phase
router.get('/:phaseId', async (req, res) => {
    try {
        const { phaseId } = req.params;

        // Get phase details first
        const [phaseDetails] = await database.query(
            'SELECT title, phaseNo FROM phases WHERE id = ?',
            [phaseId]
        );

        // Get all sections with phase info
        const [sections] = await database.query(
            `SELECT ps.*, p.title as phase_title, p.phaseNo 
             FROM profile_sections ps
             JOIN phases p ON ps.phase_id = p.id
             WHERE ps.phase_id = ? 
             ORDER BY ps.display_order`,
            [phaseId]
        );

        if (sections.length === 0) {
            return res.status(404).json({ 
                message: "No profile sections found for this phase"
            });
        }

        res.json({
            phaseDetails: phaseDetails[0],
            sections: sections
        });
        
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: "Failed to retrieve profile",
            error: error.message 
        });
    }
});

// Update a section (requires authentication)
router.patch('/:phaseId/section/:sectionId', authenticate, async (req, res) => {
    try {
        const { phaseId, sectionId } = req.params;
        const { section_title, content, reference_text } = req.body;

        // First verify the section exists
        const [existingSection] = await database.query(
            'SELECT * FROM profile_sections WHERE id = ? AND phase_id = ?',
            [sectionId, phaseId]
        );

        if (!existingSection || existingSection.length === 0) {
            return res.status(404).json({ 
                message: "Section not found",
                details: `No section found with id ${sectionId} for phase ${phaseId}`
            });
        }

        // Prepare update data
        const updateData = {};
        if (section_title !== undefined) updateData.section_title = section_title;
        if (content !== undefined) updateData.content = content;
        if (reference_text !== undefined) updateData.reference_text = reference_text;
        updateData.updated_at = new Date();

        // Perform the update
        const [result] = await database.query(
            `UPDATE profile_sections 
             SET ? 
             WHERE id = ? AND phase_id = ?`,
            [updateData, sectionId, phaseId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ 
                message: "Failed to update section",
                details: "No rows were affected by the update"
            });
        }

        // Fetch the updated section to return in response
        const [updatedSection] = await database.query(
            'SELECT * FROM profile_sections WHERE id = ? AND phase_id = ?',
            [sectionId, phaseId]
        );

        res.json({ 
            message: "Section updated successfully",
            section: updatedSection[0]
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: "Failed to update section",
            error: error.message
        });
    }
});

// Create a new section (requires authentication)
router.post('/:phaseId/section', authenticate, async (req, res) => {
    try {
        const { phaseId } = req.params;
        const { section_title, content, reference_text, section_icon, display_order } = req.body;

        const [result] = await database.query(
            `INSERT INTO profile_sections 
             (phase_id, section_title, content, reference_text, section_icon, display_order)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [phaseId, section_title, content, reference_text, section_icon, display_order]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ 
                message: "Failed to create section" 
            });
        }

        // Fetch the newly created section
        const [newSection] = await database.query(
            'SELECT * FROM profile_sections WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            message: "Section created successfully",
            section: newSection[0]
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            message: "Failed to create section",
            error: error.message
        });
    }
});

module.exports = router;