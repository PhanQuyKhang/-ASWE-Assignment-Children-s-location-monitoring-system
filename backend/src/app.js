const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
    console.log("====================================");
    console.log("🎉 TUYỆT VỜI! ĐÃ NHẬN ĐƯỢC DỮ LIỆU TỪ ARDUINO!");
    console.log("Nội dung gửi lên:", req.body);
    console.log("====================================");

    res.status(200).send("OK");
});

// ✅ FIX HERE
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại cổng ${PORT}`);
});