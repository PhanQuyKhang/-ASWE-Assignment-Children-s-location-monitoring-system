require("dotenv").config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const LogRouter = require('./routes/LogRoute');
const AuthRouter = require('./routes/AuthRoute');
const DeviceRouter = require('./routes/DeviceRoute'); // IMPORT NEW ROUTE
const BoundaryRoute = require('./routes/BoundaryRoute'); 
const http = require('http'); 
const { Server } = require('socket.io'); 
const { sql, testConnection } = require('./database/connection'); 
const WSHandler = require('./services/WSHandler');
const startHeartbeatMonitor = require('./Cron/DeviceHeartbeat.js');

const app = express();
app.use((req, res, next) => {
    console.log(`🛎️  Knock Knock: ${req.method} ${req.url}`);
    next();
});
const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
].filter(Boolean));

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
app.use('/device', DeviceRouter);
app.use('/device/boundary', BoundaryRoute);

//----------------------------SERVER-------------------------------------------

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], 
        credentials: true
    }
});

WSHandler(io);

server.listen(PORT, async () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    
    const isDbConnected = await testConnection();

    if (isDbConnected) {
        //startHeartbeatMonitor();
    } else {
        console.error("⚠️ CẢNH BÁO: Database không kết nối được! Các tính năng liên quan đến DB sẽ lỗi.");
    }
});