const lineService = require('services/lineService');
const { pool } = require('../config/database');

// API สมัครเวร
exports.applyForShift = async (req, res) => {
    const { shiftId } = req.params;
    const { userId } = req.body; // ได้จาก LINE webhook
    
    try {
        // 1. ดึงข้อมูลผู้ใช้จาก LINE
        const userProfile = await lineService.getUserProfile(userId);
        
        // 2. ตรวจสอบว่าสมัครแล้วหรือยัง
        const existingApplication = await pool.query(
            'SELECT * FROM shift_applications WHERE shift_id = $1 AND user_id = $2',
            [shiftId, userId]
        );
        
        if (existingApplication.rows.length > 0) {
            return res.status(400).json({ 
                error: 'คุณสมัครเวรนี้แล้ว',
                applied_at: existingApplication.rows[0].applied_at
            });
        }
        
        // 3. บันทึกการสมัคร พร้อม User ID
        const result = await pool.query(`
            INSERT INTO shift_applications (shift_id, user_id, display_name)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [shiftId, userId, userProfile.displayName]);
        
        res.json({ 
            success: true, 
            message: 'สมัครเวรสำเร็จ',
            application: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error applying for shift:', error);
        res.status(500).json({ error: error.message });
    }
};

// ดูประวัติเวรของผู้ใช้
exports.getUserShiftHistory = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.shift_type,
                s.required_people,
                sa.assigned_at,
                'completed' as status
            FROM shift_assignments sa
            JOIN shifts s ON sa.shift_id = s.id
            WHERE sa.user_id = $1
            ORDER BY sa.assigned_at DESC
        `, [userId]);
        
        res.json({
            userId,
            shifts: result.rows,
            total_shifts: result.rows.length
        });
        
    } catch (error) {
        console.error('Error getting user shift history:', error);
        res.status(500).json({ error: error.message });
    }
};
