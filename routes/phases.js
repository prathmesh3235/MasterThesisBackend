const express = require('express');
const database = require('../utils/database');
const { authenticate } = require('../utils/tokens');

// Create a router object
const router = express.Router();

// Phases route
router.get('/', async (req, res) => {
    try {
        const [results, fields] = await database.query('SELECT * FROM phases'); // Replace 'your_table' with your actual table name
        res.send(results);
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).send('Failed to fetch data');
    }
});

router.get('/:id', async (req, res) => {
    try {
        let id = req.params.id;
        if (isNaN(id) || id < 1) {
            res.status(400).send({message: 'Invalid id'});
            return;
        }
        const [results, fields] = await database.query(`SELECT * FROM phases where id = ?`, [id]); // Replace 'your_table' with your actual table name
        if (results && results.length == 0) {
            res.status(404).send({message: 'Phase not found'});
            return;
        }
    res.send({data: results[0]});
    } catch (error) {
        console.error('Failed to fetch data:', error);
        res.status(500).send('Failed to fetch data');
    }
});

// Endpoint to update the description of a phase
router.patch('/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const { title, profile_info } = req.body;

    // Check for a valid id
    if (isNaN(id) || id < 1) {
        return res.status(400).send({message: 'Invalid id'});
    }

    const [results, fields] = await database.query(`SELECT * FROM phases where id = ?`, [id]); // Replace 'your_table' with your actual table name
    if (results && results.length == 0) {
        res.status(404).send({message: 'Phase not found'});
        return;
    }

    // Prepare the SQL query and the values array dynamically based on provided input
    let updates = [];
    let values = [];

    if (title) {
        updates.push('title = ?');
        values.push(title);
    }

    if (profile_info) {
        // Check if profile_info is a valid JSON string
        try {
            JSON.parse(profile_info); // Parse to ensure it's valid JSON
            updates.push('profile_info = ?');
            values.push(profile_info);
        } catch (error) {
            return res.status(400).send({message: 'Invalid JSON format for profile_info'});
        }
    }

    if (updates.length > 0) {
        values.push(id); // Add the id to the values array for the SQL query
        const query = `UPDATE phases SET ${updates.join(', ')} WHERE id = ?`;

        try {
            // Perform the update
            const [results] = await database.query(query, values);
            
            // Check if the update was successful
            if (results.affectedRows === 0) {
                return res.status(404).send({message: 'Phase not found'});
            }

            res.send({message: 'Phase updated successfully'});
        } catch (error) {
            console.error('Failed to update phase:', error);
            res.status(500).send('Failed to update data');
        }
    } else {
        res.status(400).send({message: 'No valid fields provided for update'});
    }
});


// Export the router
module.exports = router;
