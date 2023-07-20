const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./helpers/formatDate')
const {getActiveUser,exitRoom,newUser,getIndividualRoomUsers} = require('./helpers/userHelper');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = newUser(socket.id, username, room);

    socket.join(user.room);

    socket.emit('message', formatMessage("Quick Chat", 'Hello Guys! Welcome to Quick Chat '));

    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage("Quick Chat", `${user.username} Entered`)
      );

    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getIndividualRoomUsers(user.room)
    });
  });

  socket.on('chatMessage', msg => {
    const user = getActiveUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = exitRoom(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage("Quick Chat", `${user.username} left`)
      );

      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getIndividualRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));