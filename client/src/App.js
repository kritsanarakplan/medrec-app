// client/src/App.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // หากมี CSS

// *** บรรทัดที่ 1: เพิ่มการกำหนด BASE URL ของ API ***
// ใน Production (บน Render), process.env.REACT_APP_API_URL จะมีค่าเป็น URL ของ Backend
// ใน Development (บนเครื่องของคุณ), จะใช้ 'http://localhost:5000' ซึ่งจะทำงานร่วมกับ proxy ใน package.json
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch items from backend
  const fetchItems = async () => {
    try {
      // *** บรรทัดที่ 2: แก้ไข URL สำหรับเรียก API GET ***
      // ใช้ API_BASE_URL ที่เรากำหนดไว้
      const response = await axios.get(`${API_BASE_URL}/api/items`);
      setItems(response.data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to fetch items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new item
  const addItem = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!newItemName.trim()) {
      setError("Item name cannot be empty.");
      return;
    }

    try {
      // *** บรรทัดที่ 3: แก้ไข URL สำหรับเรียก API POST ***
      // ใช้ API_BASE_URL ที่เรากำหนดไว้
      const response = await axios.post(`${API_BASE_URL}/api/items`, {
        name: newItemName,
        description: newItemDescription,
      });
      setItems([...items, response.data]); // Add new item to state
      setNewItemName(''); // Clear input fields
      setNewItemDescription('');
      setError(null);
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item. Please try again.");
    }
  };

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return <div className="App">Loading items...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>My React-Node App</h1>
      </header>

      <main>
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

        <h2>Items List</h2>
        {items.length === 0 ? (
          <p>No items found. Add some!</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>: {item.description}
              </li>
            ))}
          </ul>
        )}

        <h2>Add New Item</h2>
        <form onSubmit={addItem}>
          <div>
            <label htmlFor="itemName">Item Name:</label>
            <input
              type="text"
              id="itemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="itemDescription">Description:</label>
            <input
              type="text"
              id="itemDescription"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
            />
          </div>
          <button type="submit">Add Item</button>
        </form>
      </main>
    </div>
  );
}

export default App;
