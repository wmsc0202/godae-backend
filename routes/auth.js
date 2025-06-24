import express from 'express';
import bcrypt from 'bcrypt';
import { body, query, validationResult } from 'express-validator';
import pool from '../db.js';
import jwt from 'jsonwebtoken';
import { sendTemporaryPassword } from '../utils/sendTemporaryPassword.js';

const router = express.Router();

// 회원가입 API
router.post('/register', [
    body('email').isEmail().withMessage('유효한 이메일 입력'),
    body('nickname').isLength({ max: 10 }).withMessage('닉네임은 10자 이하'),
    body('password').matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/).withMessage('사용할 수 없는 비밀번호입니다.'),
    body('passwordConfirm')
        .custom((value, { req }) => {
            if(value !== req.body.password) {
                throw new Error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
            }
            return true;
        }),
    body('gender').isIn(['남', '여']).withMessage('성별은 남 또는 여'),
    body('accountType').isIn(['일반', '교수']).withMessage('가입유형 오류')
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, nickname, password, gender, accountType } = req.body;

    try {
        const conn = await pool.getConnection();

        // 닉네임 중복확인 했는지 체크
        const [rows] = await conn.execute(
            'SELECT id FROM users WHERE nickname = ?',
            [nickname]
        );

        if (rows.length > 0)
            return res.status(409).json({ message: '닉네임 중복확인을 진행해주세요.'});
        

        // 비밀번호 해시화
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const [result] = await conn.execute(`
            INSERT INTO users (email, nickname, password_hash, gender, account_type)
            VALUES (?, ?, ?, ?, ?)
        `, [
            email,
            nickname,
            passwordHash,
            gender === '남' ? 'M' : 'F',
            accountType === '일반' ? 'NORMAL' : 'PROFESSOR'
        ]);

        conn.release();
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        if(err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: '이메일 또는 닉네임 중복' });
        }
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 닉네임 중복확인 API
router.get('/nickname_duplicate_check', [
    query('nickname')
        .isLength({ max: 10 })
        .withMessage('닉네임은 10자 이하')
        .notEmpty()
        .withMessage('닉네임을 입력해주세요.')
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nickname } = req.query;

    try {
        const conn = await pool.getConnection();

        const [result] = await conn.execute(
            `SELECT id FROM users WHERE nickname = ?`,
            [nickname]
        );
        conn.release();

        if (result.length > 0)
            return res.status(409).json({ message: '사용 중인 닉네임입니다.'});

        return res.status(200).json({ message: '사용 가능한 닉네임'});

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 로그인 API
router.post('/login',[
    body('email').isEmail().withMessage('이메일 형식이 잘못됨'),
    body('password').notEmpty().withMessage('비밀번호를 입력해주세요')
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {email, password} = req.body;

    try {
        const conn = await pool.getConnection();

        // 1. 이메일로 사용자 조회
        const [rows] = await conn.execute(
            `SELECT id, email, password_hash FROM users WHERE email = ?`,
            [email]
        );
        conn.release();

        if (rows.length === 0)
            return res.status(401).json({ message: '존재하지 않는 이메일입니다.' });

        const user = rows[0];

        // 2. 비밀번호 비교
        const match = await bcrypt.compare(password, user.password_hash);
        if(!match)
            return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });

        // 3. 성공 시 사용자 정보 반환 (또는 JWT 발급)
        // Access Token 발급
        const accessToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        // Refresh Token 발급
        const refreshToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.REFRESH_SECRET,
            { expiresIn: process.env.REFRESH_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            accessToken,
            refreshToken
        })

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

// refresh 토큰 검증 및 새로운 access 토큰 발급 API
router.post('/refresh', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ message: 'refresh 토큰 없음'});

    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

        const newAccessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        return res.json({ accessToken: newAccessToken });
    } catch (err) {
        return res.status(401).json({ message: 'refresh 토큰 만료'})
    }
});

// 비밀번호 찾기 API
router.post('/find-password', async (req, res) => {
    const {email} = req.body;

    try{
        const conn = await pool.getConnection();

        const [users] = await conn.execute(`SELECT id FROM users WHERE email = ?`, [email]);
        if (users.length === 0) {
            conn.release();
            return res.status(400).json({ message: '등록되지 않은 이메일입니다.' });
        }

        // 임시 비밀번호 생성
        const tempPassword = Math.random().toString(36).slice(-10) + '!';
        const hashed = await bcrypt.hash(tempPassword, 10);

        // DB 업데이트
        await conn.execute(`UPDATE users SET password_hash = ? WHERE email = ?`, [hashed, email]);
        conn.release();

        // 이메일 전송
        await sendTemporaryPassword(email, tempPassword);

        res.status(200).json({ message: '임시 비밀번호가 이메일로 전송되었습니다.' });
    } catch(err){
        console.error(err);
        res.status(500).json({ message: '서버 오류' });
    }
});

export default router;
