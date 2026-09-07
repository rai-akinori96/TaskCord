const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: "*" },
  maxHttpBufferSize: 1e7
});

let messageHistory = [];
let pinnedMessage = null;

io.on('connection', (socket) => {
  // Mọi kết nối đều tự động tham gia phòng chung 'job_room_1'
  socket.join('job_room_1');

  // Gửi thông tin lịch sử & tin nhắn ghim khi kết nối
  socket.emit('load_history', messageHistory);
  socket.emit('load_pinned', pinnedMessage);

  socket.on('join_conversation', ({ userName, userRole }) => {
    socket.userName = userName;
    socket.userRole = userRole;
  });

  socket.on('send_message', ({ text, imageData, replyTo }) => {
    const messageData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      senderName: socket.userName || 'Vô danh',
      senderRole: socket.userRole || 'candidate',
      text: text || '',
      imageData: imageData || null,
      replyTo: replyTo || null,
      isRevoked: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    messageHistory.push(messageData);
    // Phát tin nhắn đến tất cả người dùng trong phòng
    io.to('job_room_1').emit('receive_message', messageData);
  });

  socket.on('revoke_message', ({ messageId }) => {
    const msg = messageHistory.find(m => m.id === messageId);
    if (msg) {
      msg.isRevoked = true;
      msg.text = '';
      msg.imageData = null;
      io.to('job_room_1').emit('message_revoked', { messageId });
      
      if (pinnedMessage && pinnedMessage.id === messageId) {
        pinnedMessage = null;
        io.to('job_room_1').emit('message_pinned', null);
      }
    }
  });

  socket.on('pin_message', ({ message }) => {
    pinnedMessage = message;
    io.to('job_room_1').emit('message_pinned', pinnedMessage);
  });
});

server.listen(5000, () => console.log('Server running on port 5000'));