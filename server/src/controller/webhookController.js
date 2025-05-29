const lineService = require('/services/lineService');

exports.handleWebhook = async (req, res) => {
    try {
        const events = req.body.events;
        
        for (const event of events) {
            await handleLineEvent(event);
        }
        
        res.status(200).end();
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).end();
    }
};

async function handleLineEvent(event) {
    // รับ User ID จาก event
    const userId = event.source.userId;
    
    if (event.type === 'postback') {
        const data = new URLSearchParams(event.postback.data);
        const action = data.get('action');
        const shiftId = data.get('shiftId');
        
        if (action === 'apply') {
            try {
                // เรียก API สมัครเวรพร้อม User ID
                await fetch(`${process.env.BASE_URL}/api/shifts/${shiftId}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }) // ⭐ ส่ง User ID
                });
                
                // ตอบกลับผู้ใช้
                await lineService.client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '✅ สมัครเวรสำเร็จแล้ว!'
                });
                
            } catch (error) {
                await lineService.client.replyMessage(event.replyToken, {
                    type: 'text',
                    text: '❌ เกิดข้อผิดพลาดในการสมัครเวร'
                });
            }
        }
    }
    
    // บันทึก User Profile เมื่อมี interaction
    if (userId) {
        await lineService.getUserProfile(userId);
    }
}