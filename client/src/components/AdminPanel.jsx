import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://medrec-app.onrender.com';

const AdminPanel = () => {
    const [formData, setFormData] = useState({
        shiftType: '',
        requiredPeople: 1
    });
    const [loading, setLoading] = useState(false);
    const [shifts, setShifts] = useState([]); // State สำหรับเก็บรายการเวรที่จัดกลุ่มแล้ว
    const [randomizingShiftId, setRandomizingShiftId] = useState(null);

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/shifts`);
            if (response.ok) {
                const rawData = await response.json();
                // จัดกลุ่มข้อมูลที่ได้จาก API ให้เป็นโครงสร้างที่ใช้งานง่าย
                const groupedShifts = groupShiftsWithApplications(rawData);
                setShifts(groupedShifts);
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

    // ฟังก์ชันสำหรับจัดกลุ่มข้อมูลเวรกับผู้สมัคร
    const groupShiftsWithApplications = (data) => {
        const shiftsMap = new Map();

        data.forEach(item => {
            const shiftId = item.id;
            if (!shiftsMap.has(shiftId)) {
                // ถ้ายังไม่มีเวรนี้ใน Map ให้สร้าง Object ของเวรขึ้นมา
                shiftsMap.set(shiftId, {
                    id: item.id,
                    shift_type: item.shift_type,
                    required_people: item.required_people,
                    status: item.status,
                    created_at: item.created_at,
                    applications: [] // เตรียม Array สำหรับเก็บผู้สมัคร
                });
            }
            // เพิ่มข้อมูลผู้สมัครเข้าไปใน Array applications ของเวรนั้นๆ
            // ตรวจสอบให้แน่ใจว่ามีข้อมูลผู้สมัคร (บางครั้ง JOIN อาจคืนค่า null ถ้าไม่มีผู้สมัคร)
            if (item.user_id && item.display_name) {
                shiftsMap.get(shiftId).applications.push({
                    application_id: item.application_id, // ถ้ามีคอลัมน์นี้
                    user_id: item.user_id,
                    display_name: item.display_name,
                    applied_at: item.applied_at
                });
            }
        });

        // แปลง Map เป็น Array ของ Object เพื่อให้ React map ได้
        return Array.from(shiftsMap.values()).sort((a, b) => b.id - a.id); // เรียงจาก ID ล่าสุด
    };

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
                    fetchShifts(); // อัพเดทรายการเวรหลังจากสุ่มสำเร็จ
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
                        marginBottom: '30px'
                    }}
                >
                    {loading ? 'กำลังสร้าง...' : 'สร้างเวรและส่งประกาศ'}
                </button>
            </form>

            ---

            <h2>รายการเวรทั้งหมด</h2>
            {loading && shifts.length === 0 ? (
                <p>กำลังโหลดข้อมูลเวร...</p>
            ) : shifts.length === 0 ? (
                <p>ยังไม่มีเวร</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {shifts.map((shift) => (
                        <div key={shift.id} style={{
                            border: '1px solid #eee',
                            borderRadius: '8px',
                            padding: '15px',
                            boxShadow: '0 2px 4px rgba[0,0,0,0.1]',
                            backgroundColor: shift.status === 'completed' ? '#f0f0f0' : 'white'
                        }}>
                            <h3>{shift.shift_type}</h3>
                            <p><strong>รหัสเวร:</strong> {shift.id}</p>
                            <p><strong>ต้องการ:</strong> {shift.required_people} คน</p>
                            <p><strong>สถานะ:</strong> {shift.status === 'open' ? 'เปิดรับสมัคร' : 'สุ่มเสร็จสิ้น'}</p>

                            {/* แสดงรายชื่อผู้สมัคร */}
                            <div style={{ marginTop: '10px' }}>
                                <h4>ผู้ลงสมัคร ({shift.applications.length} คน):</h4>
                                {shift.applications.length > 0 ? (
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '0' }}>
                                        {shift.applications.map((app) => (
                                            <li key={app.user_id + '_' + shift.id} style={{ fontSize: '0.9em', color: '#666' }}> {/* ใช้ user_id + shift.id เป็น key เพื่อความไม่ซ้ำ */}
                                                {app.display_name} (สมัครเมื่อ: {new Date(app.applied_at).toLocaleString('th-TH')})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ fontSize: '0.9em', color: '#999' }}>ยังไม่มีผู้สมัคร</p>
                                )}
                            </div>

                            {shift.status === 'open' && (
                                <button
                                    onClick={() => handleRandomizeShift(shift.id)}
                                    disabled={randomizingShiftId === shift.id || shift.applications.length < shift.required_people}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: (randomizingShiftId === shift.id || shift.applications.length < shift.required_people) ? 'not-allowed' : 'pointer',
                                        marginTop: '15px'
                                    }}
                                >
                                    {randomizingShiftId === shift.id ? 'กำลังสุ่ม...' : 'สุ่มผู้สมัครเวร'}
                                </button>
                            )}
                            {shift.status === 'open' && shift.applications.length < shift.required_people && (
                                <p style={{ color: 'orange', fontSize: '0.85em', marginTop: '5px' }}>
                                    (ผู้สมัครไม่ครบจำนวนที่ต้องการ)
                                </p>
                            )}
                            {shift.status === 'completed' && (
                                <p style={{ color: '#555', fontStyle: 'italic', marginTop: '15px' }}>เวรนี้สุ่มเสร็จสิ้นแล้ว</p>
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