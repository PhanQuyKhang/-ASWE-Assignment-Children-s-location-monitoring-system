const jwt = require('jsonwebtoken');
const DeviceModel = require('../models/DeviceModel');
const LocalMegaphone = require('../services/LocalMegaphone'); 

module.exports = (io) => { 
    
    // ==========================================
    // PART 1: THE LOCAL LISTENER 
    // ==========================================
    LocalMegaphone.on('DEVICE_UPDATES', (event) => {
        try {
            const roomName = `room_device_${event.device_id}`;
            
            io.to(roomName).emit('location_update', event.data);
            
        } catch (error) {
            console.error("Failed to process local event:", error);
        }
    });

    // ==========================================
    // PART 2: SOCKET SECURITY & ROOM ROUTING
    // ==========================================
    const getCookie = (cookieString, cookieName) => {
        if (!cookieString) return null;
        const match = cookieString.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
        if (match) return match[2];
        return null;
    };
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.headers.token || getCookie(socket.handshake.headers.cookie,'clms_access_token');
            console.log(token)
            if (!token) throw new Error("No token provided");
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log ("verified token");
            const userDevices = await DeviceModel.getActiveDevices(decoded.user_id);
            console.log (userDevices);
            socket.allowedDevices = userDevices; 
            
            next(); 
            
        } catch (err) {
            console.log("Blocked unauthorized connection attempt.");
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🟢 Parent Connected! Socket: ${socket.id}`);
        if (socket.allowedDevices && socket.allowedDevices.length > 0) {
            socket.allowedDevices.forEach(deviceId => {
                const roomName = `room_device_${deviceId}`;
                socket.join(roomName);
                console.log(`   ↳ Socket securely joined: ${roomName}`);
            });
        } else {
            console.log(`   ↳ Warning: Parent connected but has no assigned devices.`);
        }

        socket.on('disconnect', () => {
            console.log(`🔴 Parent disconnected. Socket: ${socket.id}`);
        });
    });
};