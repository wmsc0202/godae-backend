import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import myInfoRoutes from './routes/my-info.js';

const app = express();
app.use(express.json());

// 등록된 라우트 사용
app.use('/auth', authRoutes);
app.use('/my-info', myInfoRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`서버 실행 중: http://localhost:${port}`);
});