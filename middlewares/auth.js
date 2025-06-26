import jwt from 'jsonwebtoken';

// 토큰 검증 미들웨어
export function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) return res.status(401).json({ message: '토큰 없음' });

    const token = authHeader.split(' ')[1]; // "Bearer <token>" 에서 토큰만 추출

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if(err.name === 'TokenExpiredError')
            return res.status(401).json({ message: '토큰 만료' });

        return res.status(401).json({ message: '유효하지 않은 토큰' });
    }
}