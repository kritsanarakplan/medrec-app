// server/src/index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// *** เพิ่มส่วนนี้สำหรับ Line Bot SDK ***
const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new line.Client(config); // Client สำหรับส่งข้อความ
const middleware = line.middleware(config); // Middleware สำหรับตรวจสอบ Signature ของ Webhook
// *** สิ้นสุดส่วน Line Bot SDK ***

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'https://medred-app-1.onrender.com' // อย่าลืมใส่ URL Frontend ของคุณ
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


// *** ส่วนของ Line Webhook Endpoint ***
app.post('/webhook', middleware, (req, res) => {
  // เมื่อ Line ส่ง Event มาที่นี่
  console.log('Line Webhook Event:', JSON.stringify(req.body.events));

  // Array ของ Promise ที่จะ Resolve ด้วยการ Handle แต่ละ Event
  const events = req.body.events;
  Promise
    .all(events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันสำหรับ Handle แต่ละ Event จาก Line
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ถ้าไม่ใช่ข้อความ หรือไม่ใช่ข้อความแบบ text ไม่ต้องทำอะไร
    return Promise.resolve(null);
  }

  const receivedText = event.message.text.toLowerCase();
  let replyMessage = { type: 'text', text: 'ฉันไม่เข้าใจคำสั่งของคุณ' }; // ข้อความตอบกลับเริ่มต้น

  if (receivedText === 'flex message') {
    // *** นี่คือส่วนที่คุณจะสร้าง Flex Message JSON ***
    const flexMessage = {
      "type": "flex",
      "altText": "นี่คือ Flex Message ตัวอย่าง", // ข้อความที่จะแสดงเมื่อ Flex Message ไม่แสดง
      "contents": {
        "type": "bubble",
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "Hello, Flex Message!",
              "weight": "bold",
              "size": "xl"
            },
            {
              "type": "text",
              "text": "นี่คือข้อความจาก Flex Message ครับ"
            },
            {
              "type": "button",
              "action": {
                "type": "uri",
                "label": "ไปที่ Google",
                "uri": "https://www.google.com"
              },
              "style": "primary",
              "margin": "md"
            }
          ]
        }
      }
    };
    // *** สิ้นสุดส่วนสร้าง Flex Message JSON ***

    return client.replyMessage(event.replyToken, flexMessage); // ส่ง Flex Message กลับ
  } else if (receivedText === 'hello') {
    replyMessage = { type: 'text', text: 'สวัสดีครับ!' };
    return client.replyMessage(event.replyToken, replyMessage);
  } else if (receivedText === 'items') {
      // ดึงรายการ Items จาก API ของตัวเอง (ถ้าต้องการ)
      // หรือจะแค่ตอบเป็นข้อความธรรมดาก็ได้
      const itemsList = items.map(item => `${item.name}: ${item.description}`).join('\n');
      replyMessage = { type: 'text', text: `รายการ Items ที่มี:\n${itemsList || 'ยังไม่มีรายการ'}` };
      return client.replyMessage(event.replyToken, replyMessage);
  }


  // สำหรับข้อความอื่นๆ หรือถ้าไม่มีเงื่อนไขใดๆ ตรง
  return client.replyMessage(event.replyToken, replyMessage);
}
// *** สิ้นสุดส่วนของ Line Webhook Endpoint ***


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});