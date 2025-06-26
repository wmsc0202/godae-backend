import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setupChatSocket } from './sockets/chat-socket.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Unity, Web 등 클라이언트 허용
        methods: ['GET', 'POST']
    }
});

setupChatSocket(io);

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`서버 실행 중: http://localhost:${port}`);
});