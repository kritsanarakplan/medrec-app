const express = require('express');
const { Pool } = require('pg');
const line = require('@line/bot-sdk');
const cors = require('cors');
require('dotenv').config();
const app = express();

// LINE Bot configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

app.use('/webhook', line.middleware(config));
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
      ssl: {
    rejectUnauthorized: false // จำเป็นสำหรับ Render หรือบริการ Cloud PostgreSQL ส่วนใหญ่
                              // หากต้องการความปลอดภัยสูงสุดใน Production ควรใช้ CA certificate
  }
});



const client = new line.Client(config);
const GROUP_ID = process.env.GROUP_ID; // ID ของกลุ่มไลน์

// API Routes

// 1. สร้างเวรใหม่และส่งประกาศ
app.post('/api/shifts/create', async (req, res) => {
    const { shiftType, requiredPeople } = req.body;
    
    try {
        // บันทึกเวรใหม่
        const result = await pool.query(
            'INSERT INTO shifts (shift_type, required_people) VALUES ($1, $2) RETURNING *',
            [shiftType, requiredPeople]
        );
        
        const shift = result.rows[0];
        
        // สร้าง Flex Message
        const flexMessage = createShiftFlexMessage(shift);
        
        // ส่งข้อความไปกลุ่ม
        await client.pushMessage(GROUP_ID, flexMessage);
        
        res.json({ success: true, shift });
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. สมัครเวร
app.post('/api/shifts/:shiftId/apply', async (req, res) => {
    const { shiftId } = req.params;
    const { userId, displayName } = req.body;
    
    try {
        // ตรวจสอบว่าสมัครแล้วหรือยัง
        const existingApplication = await pool.query(
            'SELECT * FROM shift_applications WHERE shift_id = $1 AND user_id = $2',
            [shiftId, userId]
        );
        
        if (existingApplication.rows.length > 0) {
            return res.status(400).json({ error: 'คุณสมัครเวรนี้แล้ว' });
        }
        
        // บันทึกการสมัคร
        await pool.query(
            'INSERT INTO shift_applications (shift_id, user_id, display_name) VALUES ($1, $2, $3)',
            [shiftId, userId, displayName]
        );
        
        res.json({ success: true, message: 'สมัครเวรสำเร็จ' });
    } catch (error) {
        console.error('Error applying for shift:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. สุ่มคนได้เวร
app.post('/api/shifts/:shiftId/random', async (req, res) => {
    const { shiftId } = req.params;
    
    try {
        // ดึงข้อมูลเวร
        const shiftResult = await pool.query('SELECT * FROM shifts WHERE id = $1', [shiftId]);
        const shift = shiftResult.rows[0];
        
        if (!shift) {
            return res.status(404).json({ error: 'ไม่พบเวรนี้' });
        }
        
        // ดึงผู้สมัครทั้งหมด
        const applicationsResult = await pool.query(
            'SELECT * FROM shift_applications WHERE shift_id = $1',
            [shiftId]
        );
        
        const applications = applicationsResult.rows;
        
        if (applications.length === 0) {
            return res.status(400).json({ error: 'ไม่มีผู้สมัครเวรนี้' });
        }
        
        // สุ่มคนได้เวร (ไม่ซ้ำ)
        const selectedCount = Math.min(shift.required_people, applications.length);
        const shuffled = applications.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, selectedCount);
        
        // บันทึกผลการสุ่ม
        for (const person of selected) {
            await pool.query(
                'INSERT INTO shift_assignments (shift_id, user_id, display_name) VALUES ($1, $2, $3)',
                [shiftId, person.user_id, person.display_name]
            );
        }
        
        // อัพเดทสถานะเวร
        await pool.query('UPDATE shifts SET status = $1 WHERE id = $2', ['completed', shiftId]);
        
        // ลบข้อมูลการสมัคร
        await pool.query('DELETE FROM shift_applications WHERE shift_id = $1', [shiftId]);
        
        // ส่งผลการสุ่มไปกลุ่ม
        const resultMessage = createResultMessage(shift, selected);
        await client.pushMessage(GROUP_ID, resultMessage);
        
        res.json({ success: true, selected });
    } catch (error) {
        console.error('Error randomizing shift:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Webhook สำรับ LINE Bot
app.post('/webhook', (req, res) => {
    console.log('Line Webhook Event:', JSON.stringify(req.body.events));
     const events = req.body.events;
  events.forEach(event => {
    console.log('event.source:', event.source);
  });
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});

// จัดการ Event จาก LINE
async function handleEvent(event) {
    if (event.type !== 'postback') return Promise.resolve(null);
    
    const data = new URLSearchParams(event.postback.data);
    const action = data.get('action');
    const shiftId = data.get('shiftId');
    
    if (action === 'apply') {
        try {
            const response = await fetch(`${process.env.BASE_URL}/api/shifts/${shiftId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: event.source.userId,
                    displayName: await getDisplayName(event.source.userId)
                })
            });
            
            const result = await response.json();
            
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: result.success ? 'สมัครเวรสำเร็จ! ✅' : result.error
            });
        } catch (error) {
            console.log(error)
            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: 'เกิดข้อผิดพลาดในการสมัครเวร'
            });
        }
    }
}

// ฟังก์ชันสร้าง Flex Message
function createShiftFlexMessage(shift) {
    return {
        type: 'flex',
        altText: `รับสมัครเวร ${shift.shift_type}`,
        contents: {
            type: 'bubble',
            header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '📢 รับสมัครเวร',
                        weight: 'bold',
                        size: 'xl',
                        color: '#00B900'
                    }
                ]
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: `ประเภท: ${shift.shift_type}`,
                        size: 'md',
                        weight: 'bold'
                    },
                    {
                        type: 'text',
                        text: `จำนวนที่รับ: ${shift.required_people} คน`,
                        size: 'sm',
                        color: '#666666'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        style: 'primary',
                        action: {
                            type: 'postback',
                            label: '🙋‍♂️ สมัครเวร',
                            data: `action=apply&shiftId=${shift.id}`
                        }
                    }
                ]
            }
        }
    };
}

// ฟังก์ชันสร้างข้อความผลการสุ่ม
function createResultMessage(shift, selected) {
    const names = selected.map(p => p.display_name).join(', ');
    return {
        type: 'text',
        text: `🎉 ผลการสุ่มเวร ${shift.shift_type}\n\nผู้ได้รับเวร:\n${names}\n\nขอแสดงความยินดี! 👏`
    };
}

// ฟังก์ชันดึงชื่อผู้ใช้
async function getDisplayName(userId) {
    try {
        const profile = await client.getProfile(userId);
        return profile.displayName;
    } catch (error) {
        return 'Unknown User';
    }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});