import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import myInfoRoutes from './routes/my-info.js';
import uploadImageRoutes from './routes/upload-image.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 업로드된 이미지 접근 가능하게 설정
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 등록된 라우트 사용
app.use('/auth', authRoutes);
app.use('/my-info', myInfoRoutes);
app.use('/upload-image', uploadImageRoutes);

export default app;

