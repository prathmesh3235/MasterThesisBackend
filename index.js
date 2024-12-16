const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

// Middleware to parse request bodies
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies
app.use(cors()); // Enable CORS for all routes

// Import routers
const phasesRouter = require('./routes/phases');
const usersRouter = require('./routes/users');
const potentialsRouter = require('./routes/ai_potential');
const profileRouter = require('./routes/profile');
const matrixRouter = require('./routes/matrix');
const productDevelopmentRouter = require('./routes/product-development-sections');
const subphasesRouter = require('./routes/subphases');


app.get('/', (req, res) => {
  const result = {
    message: "Hello World!! Welcome to backend!!"
  }
  res.send(result);
});

// Use the phases router for all '/phases' endpoint calls
app.use('/phases', phasesRouter);
// app.use('/phases/:phaseId/potentials', potentialsRouter);
app.use('/users', usersRouter);
app.use('/potential', potentialsRouter);
app.use('/profile', profileRouter);
app.use('/matrix', matrixRouter);
app.use('/product-development-sections', productDevelopmentRouter);
app.use('/phases', subphasesRouter); 



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});