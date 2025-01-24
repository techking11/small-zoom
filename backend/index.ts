import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Socket, Server as SocketIOServer } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
  },
});

interface User {
  id: string;
}

interface CallData {
  callId: string;
  signal: any;
  callerId: string;
}

interface AcceptCallData {
  to: string;
  signal: any;
}

const users: Record<string, User> = {};

io.on('connection', (socket: Socket) => {
  // Add the user to the list when they connect
  if (!users[socket.id]) {
    users[socket.id] = { id: socket.id };
  }

  // Emit the user's id to them
  socket.emit('id_report', socket.id);

  // Send the list of online users
  io.sockets.emit('online_users_report', users);

  // Handle call initiation
  socket.on('call_someone', (data: CallData) => {
    const { callId, signal, callerId } = data;

    // Check if the user to be called is online
    const targetSocket = io.sockets.sockets.get(callId);
    if (targetSocket) {
      console.log(`Calling ${callId} with signal`, signal);
      // Emit the signal to the target user
      targetSocket.emit('someone_calling', {
        signal: signal, // Signal should be a valid RTC session description
        from: callerId,
      });
    } else {
      console.log(`User ${callId} is not online.`);
    }
  });

  // Handle call acceptance
  socket.on('accept_calling', (data: AcceptCallData) => {
    const { to, signal } = data;

    // Check if the user to be called is online
    const targetSocket = io.sockets.sockets.get(to);
    if (targetSocket) {
      console.log(`Accepting call from ${socket.id} with signal`, signal);
      // Emit the accepted signal to the caller
      targetSocket.emit('call_accepted', signal);
    } else {
      console.log(`User ${to} is not online.`);
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    delete users[socket.id];
    io.sockets.emit('online_users_report', users);
  });
});

server.listen(5000, () =>
  console.log('Server is running on http://localhost:5000')
);
