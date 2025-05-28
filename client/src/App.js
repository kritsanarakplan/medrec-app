import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css'; // หากมี CSS

function App() {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch items from backend
  const fetchItems = async () => {
    try {
      // ใน Development, "proxy" ใน package.json จะเปลี่ยน /api/items เป็น http://localhost:5000/api/items
      // ใน Production, จะต้องตั้งค่า Backend API URL ที่ Render
      const response = await axios.get('/api/items');
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
      const response = await axios.post('/api/items', {
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