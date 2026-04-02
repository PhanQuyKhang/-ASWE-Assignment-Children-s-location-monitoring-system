require("dotenv").config();
const express = require('express');
const LogRouter = require('./routes/LogRoute');

const { sql, testConnection } = require('./database/connection'); 

const startHeartbeatMonitor = require('./Cron/DeviceHeartbeat.js');

const app = express();
app.use(express.json());



//----------------------------ROUTES-------------------------------------------

app.use('/log', LogRouter);

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