const jwt = require('jsonwebtoken');
const fs = require('fs');

// Middleware to verify token
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'A token is required for authentication' });
    }

    try {
        const decoded = jwt.verify(token, process.env.PUBLIC_KEY, { algorithms: ['RS256'] });
        req.userId = decoded.userId;
    } catch (err) {
        return res.status(401).json({ message: 'Invalid Token' });
    }
    next();
};

// Function to sign tokens
const signToken = (payload) => {
    const options = { algorithm: 'RS256', expiresIn: '1h' };
    return jwt.sign(payload, process.env.PRIVATE_KEY, options);
};

module.exports = { authenticate, signToken };
