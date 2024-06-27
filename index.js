const express = require('express');
const app = express();
const dotenv = require('dotenv');
dotenv.config();

// Middleware to parse request bodies
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded bodies

const phasesRouter = require('./routes/phases');
const usersRouter = require('./routes/users');
const potentialsRouter = require('./routes/potential');

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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
