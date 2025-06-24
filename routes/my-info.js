import express from 'express';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// 내 정보 불러오기 API
router.get('/', verifyToken, async (req, res) => {

    const userId = req.user.id;

    try {
        const conn = await pool.getConnection();

        const [rows] = await conn.execute(`
            SELECT
                email,
                nickname,
                pregnancy_date,
                pregnancy_trimester,
                pregnancy_weeks,
                birth_status
            FROM users
            WHERE id = ?
        `, [userId]);

        conn.release();

        if (rows.length === 0) {
            return res.status(400).json({ message: '사용자 정보를 찾을 수 없습니다.' });
        }

        return res.json(rows[0]);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 비밀번호 변경 API
router.post('/change-password', 
    verifyToken, 
    [
        body('newPassword').matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/).withMessage('사용할 수 없는 비밀번호입니다.'),
        body('passwordConfirm')
            .custom((value, { req }) => {
                if(value !== req.body.newPassword) {
                    throw new Error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                }
                return true;
            })
    ], 
    async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { password, newPassword } = req.body;
    const userId = req.user.id;

    try{
        const conn = await pool.getConnection();

        // 현재 비밀번호 확인
        const [users] = await conn.execute(
            `SELECT password_hash FROM users WHERE id = ?`,
            [userId]
        );

        if(users.length === 0) {
            conn.release();
            return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
        }

        const match = await bcrypt.compare(password, users[0].password_hash);
        if(!match) {
            conn.release();
            return res.status(401).json({ message: '현재 비밀번호가 잘못되었습니다.' });
        }

        // 비밀번호 업데이트
        const hashed = await bcrypt.hash(newPassword, 10);
        await conn.execute(
            `UPDATE users SET password_hash = ? WHERE id = ?`,
            [hashed, userId]
        );

        conn.release();
        res.status(200).json({ message: '비밀번호가 변경되었습니다.'});
    } catch(err){
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

export default router;
