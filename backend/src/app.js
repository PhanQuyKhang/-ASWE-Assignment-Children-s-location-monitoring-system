require("dotenv").config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const LogRouter = require('./routes/LogRoute');
const AuthRouter = require('./routes/AuthRoute');
const DeviceRouter = require('./routes/DeviceRoute'); // IMPORT NEW ROUTE

const { sql, testConnection } = require('./database/connection'); 

const startHeartbeatMonitor = require('./Cron/DeviceHeartbeat.js');

const app = express();

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

//----------------------------SERVER-------------------------------------------

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    
    const isDbConnected = await testConnection();

    if (isDbConnected) {
        //startHeartbeatMonitor();
    } else {
        console.error("⚠️ CẢNH BÁO: Database không kết nối được! Các tính năng liên quan đến DB sẽ lỗi.");
    }
});