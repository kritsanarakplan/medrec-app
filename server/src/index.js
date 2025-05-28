



const express = require('express');
const cors = require('cors'); // Import cors
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 5000; // ใช้ PORT จาก environment variables หรือ 5000 เป็น default

// Middleware
app.use(express.json()); // สำหรับ Parse JSON request bodies
// CORS configuration - Allow all origins for simplicity in development
// For production, it's better to restrict to your frontend URL
app.use(cors({
    origin: '*' // Allow all origins for now. We'll change this later for production.
}));

// Basic API Route
app.get('/', (req, res) => {
    res.send('Welcome to the Node.js Backend!');
});

// Example API for data (in-memory for now)
let items = [
    { id: 1, name: 'Item A', description: 'This is item A' },
    { id: 2, name: 'Item B', description: 'This is item B' },
];

// GET all items
app.get('/api/items', (req, res) => {
    res.json(items);
});

// POST a new item
app.post('/api/items', (req, res) => {
    const newItem = req.body;
    if (!newItem.name) {
        return res.status(400).json({ message: 'Item name is required' });
    }
    newItem.id = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    items.push(newItem);
    res.status(201).json(newItem);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});