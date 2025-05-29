// client/src/App.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import './App.css'; // ถ้าไม่มี CSS ของตัวเองแล้ว สามารถลบออกได้

// Import ItemForm Component
import ItemForm from './components/ItemForm';
import AdminPanel from './components/AdminPanel';
// Import Bootstrap Components สำหรับ Layout หลัก
import { Container, Row, Col, ListGroup, Spinner, Alert } from 'react-bootstrap';


// ต้องมี API_BASE_URL เหมือนเดิม (ที่เคยแก้ไขไปแล้ว)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://medrec-app.onrender.com';

function App() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันนี้จะรับ item ใหม่มาจาก ItemForm และอัปเดต state
  const handleAddItem = (newItem) => {
    setItems((prevItems) => [...prevItems, newItem]);
  };

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/items`);
      setItems(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError("Failed to fetch items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading items...</span>
        </Spinner>
        <p>Loading items...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h1 className="text-center my-4 text-secondary">My React-Node App with Bootstrap</h1>

      {error && <Alert variant="danger" className="text-center">{error}</Alert>}
      
        <Row className="justify-content-md-center mb-4">
          <Col md={10}>
            <AdminPanel />
          </Col>
        </Row>


      <Row className="justify-content-md-center">
        <Col md={8} lg={6}>
          {/* เรียกใช้ ItemForm Component */}
          <ItemForm onAddItem={handleAddItem} />
        </Col>
      </Row> 

      <Row className="justify-content-md-center mt-5">
        <Col md={8} lg={6}>
          <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-center mb-4 text-secondary">Items List</h2>
            {items.length === 0 ? (
              <p className="text-center text-muted">No items found. Add some using the form above!</p>
            ) : (
              <ListGroup>
                {items.map((item) => (
                  <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{item.name}</h5>
                      <p className="mb-0 text-muted">{item.description}</p>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default App;