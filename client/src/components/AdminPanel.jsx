import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://medrec-app.onrender.com';

const AdminPanel = () => {
    const [formData, setFormData] = useState({
        shiftType: '',
        requiredPeople: 1
    });
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState([]); // State สำหรับเก็บรายการเวรที่ดึงมา
    const [randomizingShiftId, setRandomizingShiftId] = useState(null); // State สำหรับ track ว่ากำลังสุ่มเวรไหนอยู่

    // Effect hook เพื่อดึงข้อมูลเวรเมื่อ component โหลดครั้งแรก
    useEffect(() => {
        fetchShifts();
    }, []);

    // ฟังก์ชันสำหรับดึงข้อมูลเวรทั้งหมด
    const fetchShifts = async () => {
        setLoading(true);
        try {
            // สมมติว่ามี API endpoint สำหรับดึงรายการเวรทั้งหมด เช่น /api/shifts
            const response = await fetch(`${API_BASE_URL}/api/shifts`);
            if (response.ok) {
                const data = await response.json();
                setShifts(data);
            } else {
                alert('เกิดข้อผิดพลาดในการดึงข้อมูลเวร');
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันสำหรับสร้างเวรใหม่
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
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
                fetchShifts(); // ดึงข้อมูลเวรใหม่หลังจากสร้างสำเร็จ
            } else {
                alert('เกิดข้อผิดพลาดในการสร้างเวร');
            }
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันสำหรับสุ่มผู้สมัครเวร
    const handleRandomizeShift = async (shiftId) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะสุ่มผู้สมัครสำหรับเวรนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) {
            setRandomizingShiftId(shiftId);
            try {
                const response = await fetch(`${API_BASE_URL}/api/shifts/${shiftId}/random`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    const selectedNames = result.selected.map(p => p.display_name).join(', ');
                    alert(`สุ่มผู้สมัครเวรสำเร็จ! ผู้ที่ได้รับเลือก: ${selectedNames || 'ไม่มี'}`);
                    fetchShifts(); // อัพเดทรายการเวรหลังจากสุ่มสำเร็จ (สถานะจะเปลี่ยนเป็น completed)
                } else {
                    const errorData = await response.json();
                    alert('เกิดข้อผิดพลาดในการสุ่มเวร: ' + (errorData.error || 'ไม่ทราบข้อผิดพลาด'));
                }
            } catch (error) {
                console.error('Error randomizing shift:', error);
                alert('เกิดข้อผิดพลาด: ' + error.message);
            } finally {
                setRandomizingShiftId(null);
            }
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>สร้างเวรใหม่</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>ประเภทเวร:</label>
                    <input
                        type="text"
                        value={formData.shiftType}
                        onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, requiredPeople: parseInt(e.target.value) })}
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
                        cursor: loading ? 'not-allowed' : 'pointer',
                        marginBottom: '30px' // เพิ่ม margin ด้านล่างเพื่อแยกจากส่วนรายการเวร
                    }}
                >
                    {loading ? 'กำลังสร้าง...' : 'สร้างเวรและส่งประกาศ'}
                </button>
            </form>

            <hr style={{ margin: '40px 0' }} />

            <h2>รายการเวรที่เปิดอยู่</h2>
            {loading && shifts.length === 0 ? (
                <p>กำลังโหลดข้อมูลเวร...</p>
            ) : shifts.length === 0 ? (
                <p>ยังไม่มีเวรที่เปิดอยู่</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {shifts.map((shift) => (
                        <div key={shift.id} style={{
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            padding: '15px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: shift.status === 'completed' ? '#f0f0f0' : 'white' // เปลี่ยนสีถ้าสุ่มแล้ว
                        }}>
                            <h3>{shift.shift_type}</h3>
                            <p><strong>รหัสเวร:</strong> {shift.id}</p>
                            <p><strong>ต้องการ:</strong> {shift.required_people} คน</p>
                            <p><strong>สถานะ:</strong> {shift.status === 'open' ? 'เปิดรับสมัคร' : 'สุ่มเสร็จสิ้น'}</p>
                            {shift.status === 'open' && ( // แสดงปุ่มสุ่มเฉพาะเวรที่ยังเปิดอยู่
                                <button
                                    onClick={() => handleRandomizeShift(shift.id)}
                                    disabled={randomizingShiftId === shift.id}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: randomizingShiftId === shift.id ? 'not-allowed' : 'pointer',
                                        marginTop: '10px'
                                    }}
                                >
                                    {randomizingShiftId === shift.id ? 'กำลังสุ่ม...' : 'สุ่มผู้สมัครเวร'}
                                </button>
                            )}
                            {shift.status === 'completed' && (
                                <p style={{ color: '#555', fontStyle: 'italic', marginTop: '10px' }}>เวรนี้สุ่มเสร็จสิ้นแล้ว</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;




// import React, { useState } from 'react';


// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://medrec-app.onrender.com';
// const AdminPanel = () => {
//     const [formData, setFormData] = useState({
//         shiftType: '',
//         requiredPeople: 1
//     });
//     const [loading, setLoading] = useState(false);

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);

//            try {
//             // เปลี่ยนจาก '/api/shifts/create' เป็น full URL
//             const response = await fetch(`${API_BASE_URL}/api/shifts/create`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(formData)
//             });

//             if (response.ok) {
//                 alert('สร้างเวรสำเร็จ!');
//                 setFormData({ shiftType: '', requiredPeople: 1 });
//             }
//         } catch (error) {
//             alert('เกิดข้อผิดพลาด: ' + error.message);
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
//             <h2>สร้างเวรใหม่</h2>
//             <form onSubmit={handleSubmit}>
//                 <div style={{ marginBottom: '15px' }}>
//                     <label>ประเภทเวร:</label>
//                     <input
//                         type="text"
//                         value={formData.shiftType}
//                         onChange={(e) => setFormData({...formData, shiftType: e.target.value})}
//                         required
//                         style={{ 
//                             width: '100%', 
//                             padding: '8px', 
//                             marginTop: '5px',
//                             border: '1px solid #ddd',
//                             borderRadius: '4px'
//                         }}
//                         placeholder="เช่น เวรยาม, เวรทำความสะอาด"
//                     />
//                 </div>
                
//                 <div style={{ marginBottom: '15px' }}>
//                     <label>จำนวนคนที่ต้องการ:</label>
//                     <input
//                         type="number"
//                         min="1"
//                         value={formData.requiredPeople}
//                         onChange={(e) => setFormData({...formData, requiredPeople: parseInt(e.target.value)})}
//                         required
//                         style={{ 
//                             width: '100%', 
//                             padding: '8px', 
//                             marginTop: '5px',
//                             border: '1px solid #ddd',
//                             borderRadius: '4px'
//                         }}
//                     />
//                 </div>

//                 <button 
//                     type="submit" 
//                     disabled={loading}
//                     style={{
//                         width: '100%',
//                         padding: '12px',
//                         backgroundColor: '#00B900',
//                         color: 'white',
//                         border: 'none',
//                         borderRadius: '4px',
//                         cursor: loading ? 'not-allowed' : 'pointer'
//                     }}
//                 >
//                     {loading ? 'กำลังสร้าง...' : 'สร้างเวรและส่งประกาศ'}
//                 </button>
//             </form>
//         </div>
//     );
// };

// export default AdminPanel;