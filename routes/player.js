import express from 'express';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';
import { verifyToken } from '../middlewares/auth.js';
import { snakeToCamelAll } from '../utils/snakeToCamel.js';

const router = express.Router();

// 친구 요청 보내기 API
router.post('/friend-request/:id', verifyToken, async (req, res) => {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // 중복 요청 확인
        const [exist] = await conn.execute(`
            SELECT id FROM friend_requests
            WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
        `, [senderId, receiverId]);

        if (exist.length > 0) {
            conn.release();
            return res.status(409).json({ message: '이미 요청을 보냈습니다.' });
        }

        // 요청 저장
        await conn.execute(`
            INSERT INTO friend_requests (sender_id, receiver_id)
            VALUES (?, ?)
        `, [senderId, receiverId]);

        conn.release();
        return res.json({ message: '친구 요청을 보냈습니다.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

// 친구 요청 수락 API
router.post('/friend-request/:id/accept', async (req, res) => {
    const requestId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // 요청 정보 조회
        const [rows] = await conn.execute(`
            SELECT sender_id, receiver_id FROM friend_requests
            WHERE id = ? AND status = 'pending'
        `, [requestId]);

        if(rows.length === 0) {
            conn.release();
            return res.status(404).json({ message: '유효하지 않은 요청입니다.' });
        }

        const { sender_id, receiver_id } = rows[0];

        // sender, receiver 닉네임 가져오기
        const [senderNicknameRows] = await conn.execute(`
            SELECT nickname FROM users
            WHERE id = ?
        `, [sender_id]);
        const [receiverNicknameRows] = await conn.execute(`
            SELECT nickname FROM users
            WHERE id = ?
        `, [receiver_id]);

        const senderNickname = senderNicknameRows.length > 0 ? senderNicknameRows[0].nickname : null;
        const receiverNickname = receiverNicknameRows.length > 0 ? receiverNicknameRows[0].nickname : null;

        // 요청 수락 처리
        await conn.execute(`
            UPDATE friend_requests SET status = 'accepted' WHERE id = ?
        `, [requestId]);


        // 친구 관계 저장 (양방향)
        await conn.execute(`
            INSERT INTO friends (user_id, friend_id, friend_nickname) VALUES (?, ?, ?), (?, ?, ?)
        `, [sender_id, receiver_id, receiverNickname, receiver_id, sender_id, senderNickname]);
        
        conn.release();
        return res.json({ message: '친구 요청을 수락했습니다.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

// 친구 요청 거절 API
router.post('/friend-request/:id/reject', async (req, res) => {
    const requestId = req.params.id;

    try {
        const conn = await pool.getConnection();

        // 요청 정보 조회
        const [rows] = await conn.execute(`
            SELECT sender_id, receiver_id
            FROM friend_requests
            WHERE id = ? AND status = 'pending'
        `, [requestId]);

        if(rows.length === 0) {
            conn.release();
            return res.status(404).json({ message: '유효하지 않은 요청입니다.' });
        }

        // 요청 거절 상태로 변경
        await conn.execute(`
            UPDATE friend_requests SET status = 'rejected' WHERE id = ?    
        `, [requestId]);

        conn.release();
        return res.json({ message: '친구 요청이 거절되었습니다.' });

    } catch(err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

// 친구 삭제 API
router.post('/friend-delete/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const friendId = req.params.id;

    let conn;

    try {
        conn = await pool.getConnection();

        await conn.execute(`
            DELETE FROM friends WHERE user_id = ? AND friend_id = ?
        `, [userId, friendId]);

        await conn.execute(`
            DELETE FROM friends WHERE user_id = ? AND friend_id = ?
        `, [friendId, userId]);

        return res.json({ message: '친구 삭제가 완료되었습니다.' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    } finally {
        if(conn) conn.release();
    }
});

// 친구 목록 조회 API
router.get('/friend-list', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const conn = await pool.getConnection();

        // 친구 목록 가져오기
        const [rows] = await conn.execute(`
            SELECT friend_id, friend_nickname FROM friends
            WHERE user_id = ?
        `, [userId]);
        
        conn.release();
        return res.json(snakeToCamelAll(rows));

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

// 요청 대기 목록 조회 API
router.get('/friend-request-list', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const conn = await pool.getConnection();

        // 요청 대기 목록 가져오기
        const [rows] = await conn.execute(`
           SELECT fr.id, fr.sender_id, u.nickname AS sender_nickname 
           FROM friend_requests fr
           JOIN users u ON fr.sender_id = u.id
           WHERE fr.receiver_id = ? AND fr.status = 'pending'
        `, [userId]);

        conn.release();
        return res.json(snakeToCamelAll(rows));

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

export default router;