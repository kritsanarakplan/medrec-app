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

      
      
        <Row className="justify-content-md-center mb-4">
          <Col md={10}>
            <AdminPanel />
          </Col>
        </Row>

    </Container>
  );
}

export default App;