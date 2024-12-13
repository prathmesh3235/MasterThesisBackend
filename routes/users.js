const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../utils/database');
const { authenticate, signToken } = require('../utils/tokens');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [results] = await database.query(`SELECT * FROM users where username = ?`, [username]);

    if (!results || results.length === 0) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = results[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // User matched, create JWT Payload
    const payload = { userId: user.id, role: user.role };
    const token = signToken(payload);

    // Return token and user role
    res.send({
      token,
      user: { role: user.role }
    });
});

router.patch('/:id', authenticate,  async (req, res) => {
    const { id } = req.params; 
    const { newUsername, newPassword, username, password } = req.body;

    if (id != req.userId) {
        return res.status(401).json({ message: "You are not allowed to update this resource" });
    }

    try {
        const [results] = await database.query(`SELECT * FROM users WHERE id = ? and username = ?`, [id, username]);

        if (!results || results.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }
        
        // If you need to verify the old password, uncomment the following lines:
        // const user = results[0];
        // const passwordIsValid = await bcrypt.compare(password, user.password);
        // if (!passwordIsValid) {
        //     return res.status(400).json({ message: "Invalid credentials." });
        // }

        const fieldsToUpdate = {};
        if (!newUsername && !newPassword) {
            return res.status(400).json({ message: "No fields provided for update." });
        }

        if (newUsername) fieldsToUpdate.username = newUsername;
        if (newPassword) fieldsToUpdate.password = await bcrypt.hash(newPassword, 10);

        const updates = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id];

        if (updates) {
            await database.query(`UPDATE users SET ${updates} WHERE id = ?`, values);
        }

        res.json({ message: "Credentials updated successfully." });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ message: "Failed to update user credentials." });
    }
});

module.exports = router;
