import orderRouter from './route/order.route.js'
import paymentRouter from './route/payment.route.js'

import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'
import dotenv  from 'dotenv'
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';



const app = express()

const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: process.env.SITE_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});


io.on('connection', (socket) => {
    console.log('🔗 Cliente conectado:', socket.id);

    // Evento para o cliente entrar em uma sala (room)
    socket.on('joinRoom', (orderId) => {
        console.log(`👤 Cliente ${socket.id} entrando na sala: ${orderId}`);
        
        // Sair de todas as salas anteriores
        socket.rooms.forEach(room => {
            if (room !== socket.id) {
                socket.leave(room);
            }
        });
        
        // Entrar na nova sala
        socket.join(orderId);
        
        // Confirmar que entrou na sala
        socket.emit('roomJoined', { 
            orderId, 
            socketId: socket.id,
            message: `Conectado à sala ${orderId}` 
        });
        
        // Log do número de clientes na sala
        const clientsInRoom = io.sockets.adapter.rooms.get(orderId)?.size || 0;
        console.log(`📊 Clientes na sala ${orderId}: ${clientsInRoom}`);
    });

    // Evento de desconexão
    socket.on('disconnect', (reason) => {
        console.log(`❌ Cliente ${socket.id} desconectado. Motivo: ${reason}`);
    });

    // Evento para lidar com erros
    socket.on('error', (error) => {
        console.error(`❌ Erro no socket ${socket.id}:`, error);
    });
});


io.use((socket, next) => {
    console.log(`🔍 Middleware: Cliente ${socket.id} tentando conectar`);
    next();
});



export function emitToRoom(roomId, event, data) {
    const room = io.sockets.adapter.rooms.get(roomId);
    const clientsInRoom = room ? room.size : 0;
    
    console.log(`📡 Emitindo evento '${event}' para sala ${roomId} (${clientsInRoom} clientes)`);
    
    if (clientsInRoom > 0) {
        io.to(roomId).emit(event, data);
        return true;
    } else {
        console.log(`⚠️  Nenhum cliente na sala ${roomId} para receber o evento`);
        return false;
    }
}


export function getRoomInfo(roomId) {
    const room = io.sockets.adapter.rooms.get(roomId);
    return {
        exists: !!room,
        clientCount: room ? room.size : 0,
        clients: room ? Array.from(room) : []
    };
}

dotenv.config()

const port = process.env.PORT

async function main() {
  await mongoose.connect(process.env.MONGO_URL)
}

main().then(()=>{
  console.log('connected with db')
}).catch((err)=>{
  console.log(err)
})

app.use(bodyParser.json())
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
  }))

app.use(cookieParser())

app.get('/', (req, res) =>  {
    res.send("ok")
})

app.use('/v1/order', orderRouter)
app.use('/v1/partner', partnerRouter)
app.use('/v1/payment', paymentRouter)

httpServer.listen(port, () => {
    console.log(`server and websocket started on port: ${port}`)
})