const line = require('@line/bot-sdk');
const { pool } = require('../config/database');
require('dotenv').config();
class LineService {
    constructor() {
        this.client = new line.Client({
            channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
        });
    }

    // ดึงข้อมูลผู้ใช้จาก LINE และบันทึกลง Database
    async getUserProfile(userId) {
        try {
            // ดึงข้อมูลจาก LINE API
            const profile = await this.client.getProfile(userId);
            
            // บันทึก/อัพเดทข้อมูลผู้ใช้ใน Database
            await this.saveUserProfile(profile);
            
            return profile;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return { displayName: 'Unknown User', userId };
        }
    }

    // บันทึกข้อมูลผู้ใช้ลง Database
    async saveUserProfile(profile) {
        try {
            await pool.query(`
                INSERT INTO users (user_id, display_name, picture_url, last_active)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    display_name = EXCLUDED.display_name,
                    picture_url = EXCLUDED.picture_url,
                    last_active = CURRENT_TIMESTAMP
            `, [profile.userId, profile.displayName, profile.pictureUrl]);
        } catch (error) {
            console.error('Error saving user profile:', error);
        }
    }
}

module.exports = new LineService();