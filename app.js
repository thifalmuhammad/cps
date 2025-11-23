require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', require('./src/routes'));

// Serve React build (nanti setelah build)

const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend', 'build')));
// Fallback untuk React SPA (Express 5 compatible)
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});