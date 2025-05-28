// client/src/components/ItemForm.js

import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Alert, Container, Row, Col } from 'react-bootstrap'; // <-- Import Bootstrap Components

// กำหนด BASE URL ของ API เหมือนเดิม
// ใน Production (บน Render), process.env.REACT_APP_API_URL จะมีค่าเป็น URL ของ Backend
// ใน Development (บนเครื่องของคุณ), จะใช้ 'http://localhost:5000'
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ItemForm({ onAddItem }) { // รับฟังก์ชัน onAddItem เพื่ออัปเดตรายการใน App.js
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState(''); // สำหรับแสดงข้อความสถานะ
  const [isError, setIsError] = useState(false); // สำหรับบอกว่าเป็น error หรือสำเร็จ

  const handleSubmit = async (e) => {
    e.preventDefault(); // ป้องกันการ reload หน้า
    setMessage(''); // Clear ข้อความเก่า
    setIsError(false);

    if (!name.trim()) {
      setMessage('Item name cannot be empty.');
      setIsError(true);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/items`, {
        name,
        description,
      });

      // ถ้าสำเร็จ
      setMessage('Item added successfully!');
      setName(''); // Clear inputs
      setDescription('');
      if (onAddItem) {
        onAddItem(response.data); // เรียกฟังก์ชันที่ส่งมาจาก App.js เพื่ออัปเดตรายการ
      }

    } catch (err) {
      console.error('Error adding item:', err);
      setMessage('Failed to add item. Please try again.');
      setIsError(true);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-md-center">
        <Col md={8} lg={6}>
          <div className="p-4 border rounded shadow-sm bg-light">
            <h2 className="text-center mb-4 text-primary">Add New Item</h2>

            {/* แสดงข้อความสถานะ */}
            {message && (
              <Alert variant={isError ? 'danger' : 'success'}>
                {message}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formName">
                <Form.Label>Item Name:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter item name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>Description:</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" type="submit" className="w-100">
                Save Item
              </Button>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ItemForm;