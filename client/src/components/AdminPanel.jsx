import React, { useState } from 'react';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://medrec-app.onrender.com';
const AdminPanel = () => {
    const [formData, setFormData] = useState({
        shiftType: '',
        requiredPeople: 1
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

           try {
            // เปลี่ยนจาก '/api/shifts/create' เป็น full URL
            const response = await fetch(`${API_BASE_URL}/api/shifts/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('สร้างเวรสำเร็จ!');
                setFormData({ shiftType: '', requiredPeople: 1 });
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            <h2>สร้างเวรใหม่</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>ประเภทเวร:</label>
                    <input
                        type="text"
                        value={formData.shiftType}
                        onChange={(e) => setFormData({...formData, shiftType: e.target.value})}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            marginTop: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                        placeholder="เช่น เวรยาม, เวรทำความสะอาด"
                    />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                    <label>จำนวนคนที่ต้องการ:</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.requiredPeople}
                        onChange={(e) => setFormData({...formData, requiredPeople: parseInt(e.target.value)})}
                        required
                        style={{ 
                            width: '100%', 
                            padding: '8px', 
                            marginTop: '5px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#00B900',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'กำลังสร้าง...' : 'สร้างเวรและส่งประกาศ'}
                </button>
            </form>
        </div>
    );
};

export default AdminPanel;