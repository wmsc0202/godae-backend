import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';
import { verifyToken } from '../middlewares/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 업로드 디렉토리
const uploadDir = path.join(__dirname, '../uploads/frames');
if(!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}_${Math.round(Math.random()*1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// 이미지 업로드 API
router.post('/', verifyToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
    }

    const relativePath = `/uploads/frames/${req.file.filename}`;
    const userId = req.user.id;

    try{
        const conn = await pool.getConnection();

        await conn.execute(
            `INSERT INTO frames (user_id, file_path) VALUES (?, ?)`,
            [userId, relativePath]    
        );
        conn.release();

        res.status(200).json({ 
            message: '이미지 업로드 성공',
            path: relativePath
        });

    } catch(err) {
        console.error(err);
        return res.status(500).json({ message: '서버 오류' });
    }
});

export default router;