const rooms = {};

export function setupChatSocket(io) {
    io.on('connection', (socket) => {
        console.log('🟢 연결됨:', socket.id);

        socket.on('joinRoom', ({ roomId, nickname }) => {
            socket.join(roomId);
            socket.data.nickname = nickname;
            socket.data.roomId = roomId;

            if (rooms[roomId]) {
                socket.emit('chatHistory', rooms[roomId]);
            }
        });

        socket.on('chatMessage', (msg) => {
            const { nickname, roomId } = socket.data;
            const chat = {
                nickname,
                message: msg,
                timestamp: new Date().toISOString(),
            };

            if (!rooms[roomId]) rooms[roomId] = [];
            rooms[roomId].push(chat);
            if (rooms[roomId].length > 100) rooms[roomId].shift();

            // 같은 방 사용자(본인 포함)에게 브로드캐스트
            io.to(roomId).emit('chatMessage', chat);
        });

        socket.on('disconnect', () => {
            console.log('🔴 연결 종료:', socket.id);
        });
    });
}