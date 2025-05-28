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
// *** สิ้นสุดส่วน Line Bot SDK ***

const app = express();
const PORT = process.env.PORT || 5000;

// *** เปลี่ยนลำดับของ Middleware ตรงนี้ ***

// 1. เพิ่ม Middleware สำหรับ Line Webhook ก่อน (สำคัญมาก!)
//    ใช้ app.use() เพื่อให้มันทำงานก่อน Express.json() สำหรับ Path /webhook เท่านั้น
app.use('/webhook', line.middleware(config));

// 2. express.json() สำหรับ API อื่นๆ (หลัง Line Middleware)
app.use(express.json());

// 3. CORS Middleware
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
app.post('/api/items', async (req, res) => { // <-- เพิ่ม async ตรงนี้
    const newItem = req.body;
    if (!newItem.name) {
        return res.status(400).json({ message: 'Item name is required' });
    }
    newItem.id = items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;
    items.push(newItem);

    // *** เพิ่มส่วนนี้เพื่อส่ง Flex Message ไปยัง Line ***
    const targetGroupId = 'Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; // <-- ***แทนที่ด้วย Group ID ของ Line กลุ่มของคุณ***
    // หรือถ้าจะส่งไปหา User ID ก็เป็น 'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

    // สร้าง Flex Message JSON สำหรับแจ้งเตือน
    const notificationFlexMessage = {
      type: 'flex',
      altText: `มี Item ใหม่เพิ่มเข้ามา: ${newItem.name}`,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🎉 มี Item ใหม่เพิ่มเข้ามา 🎉',
              weight: 'bold',
              size: 'lg',
              color: '#1DB446' // สีเขียว
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'box',
              layout: 'vertical',
              margin: 'lg',
              spacing: 'sm',
              contents: [
                {
                  type: 'box',
                  layout: 'baseline',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'text',
                      text: 'ชื่อ:',
                      color: '#aaaaaa',
                      size: 'sm',
                      flex: 1
                    },
                    {
                      type: 'text',
                      text: newItem.name,
                      wrap: true,
                      color: '#666666',
                      size: 'sm',
                      flex: 5
                    }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'text',
                    text: 'รายละเอียด:',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 1
                  },
                  {
                    type: 'text',
                    text: newItem.description || '-', // ถ้าไม่มี description ให้แสดง '-'
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              }
            ]
            },
            {
              type: 'separator',
              margin: 'md'
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                label: 'ดูในเว็บไซต์',
                uri: 'https://medred-app-1.onrender.com' // <-- แทนที่ด้วย URL Frontend ของคุณ
              },
              style: 'link',
              height: 'sm',
              margin: 'md'
            }
          ]
        }
      }
    };

    try {
      await client.pushMessage(targetGroupId, notificationFlexMessage); // ใช้ pushMessage เพื่อส่งไปที่ Group ID
      console.log('Flex message sent to Line group successfully!');
    } catch (lineErr) {
      console.error('Error sending Flex message to Line:', lineErr);
    }
    // *** สิ้นสุดส่วนส่ง Flex Message ***

    res.status(201).json(newItem); // ส่ง Response กลับไปที่ Frontend
});


// *** ส่วนของ Line Webhook Endpoint (ไม่ต้องมี middleware ตรงนี้แล้ว เพราะย้ายไปข้างบนแล้ว) ***
app.post('/webhook', (req, res) => { // ลบ 'middleware' ออกจากตรงนี้
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