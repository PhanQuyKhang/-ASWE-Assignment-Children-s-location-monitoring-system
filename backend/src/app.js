const express = require('express');
const app = express();

// Middleware bắt buộc để đọc được dữ liệu Arduino gửi lên
app.use(express.json()); 

// Cấu hình đường dẫn Webhook
app.post('/webhook', (req, res) => {
    console.log("====================================");
    console.log("🎉 TUYỆT VỜI! ĐÃ NHẬN ĐƯỢC DỮ LIỆU TỪ ARDUINO!");
    console.log("Nội dung gửi lên:", req.body);
    console.log("====================================");

    // DÒNG QUAN TRỌNG NHẤT: Trả lời 200 OK để Arduino biết mình đã nhận
    res.status(200).send("OK"); 
});

// Mở cửa cổng 3000
app.listen(3000, () => {
    console.log("🚀 Server Backend đang chạy tại cổng 3000, sẵn sàng hứng Webhook...");
});