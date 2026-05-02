require("dotenv").config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const LogRouter = require('./routes/LogRoute');
const AuthRouter = require('./routes/AuthRoute');
const DeviceRouter = require('./routes/DeviceRoute'); // IMPORT NEW ROUTE
const BoundaryRoute = require('./routes/BoundaryRoute'); 
const AlertRoute = require('./routes/AlertRoute'); 

const http = require('http'); 
const { Server } = require('socket.io'); 
const { testConnection } = require('./database/connection'); 
const WSHandler = require('./services/WSHandler');
const startHeartbeatMonitor = require('./Cron/DeviceHeartbeat.js');
require('./services/ParentAlertNotifier');

const app = express();
app.use((req, res, next) => {
    console.log(`🛎️  Knock Knock: ${req.method} ${req.url}`);
    next();
});
const socketAllowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL,
].filter(Boolean);

const allowedOrigins = new Set(socketAllowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());



//----------------------------ROUTES-------------------------------------------

app.use('/auth', AuthRouter);
app.use('/log', LogRouter);
app.use('/device/boundary', BoundaryRoute);
app.use('/device', DeviceRouter);
app.use('/alert', AlertRoute);

//----------------------------SERVER-------------------------------------------

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: socketAllowedOrigins.length ? socketAllowedOrigins : true,
        credentials: true
    }
});

WSHandler(io);

server.listen(PORT, async () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    
    const isDbConnected = await testConnection();

    if (isDbConnected) {
        startHeartbeatMonitor();
    } else {
        console.error("⚠️ CẢNH BÁO: Database không kết nối được! Các tính năng liên quan đến DB sẽ lỗi.");
    }
});