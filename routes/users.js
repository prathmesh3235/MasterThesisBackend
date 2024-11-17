const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../utils/database');
const { authenticate, signToken } = require('../utils/tokens');

// Create a router object
const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [results, fields] = await database.query(`SELECT * FROM users where username = ?`, [username]); // Replace 'your_table' with your actual table name


    if (results && results.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
    }    
    
    const user = results[0];


    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // User matched, create JWT Payload
    const payload = {
        userId: user.id
    };

    let token = signToken(payload)

    // Sign token
    res.send({ token });

});


router.patch('/:id', authenticate,  async (req, res) => {
    const { id } = req.params; // User ID from URL parameter
    const { newUsername, newPassword, username, password } = req.body;

    if (id != req.userId) {
        res.status(401).json({ message: "You are not allowed to update this resource" });
    }
    // First, verify the existing username and password
    try {
        const [results] = await database.query(`SELECT * FROM users WHERE id = ? and username = ?`, [id, username]);

        if (!results || results.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }
        
        const user = results[0];

        // Verify current password before making changes
        // const passwordIsValid = await bcrypt.compare(password, user.password);
        // if (!passwordIsValid) {
        //     return res.status(400).json({ message: "Invalid credentials." });
        // }

        // Prepare the update fields
        const fieldsToUpdate = {};
        if(!newUsername && !newPassword) {
            return res.status(400).json({ message: "No fields provided for update." });
        }

        if (newUsername) {
            fieldsToUpdate.username = newUsername;
        }
        if (newPassword) {
            fieldsToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        // Build the SQL query dynamically based on provided fields
        const updates = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id];

        // Perform the update operation
        if (updates) {
            await database.query(`UPDATE users SET ${updates} WHERE id = ?`, values);
        }

        res.json({ message: "Credentials updated successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Failed to update user credentials." });
    }
});

// Export the router
module.exports = router;