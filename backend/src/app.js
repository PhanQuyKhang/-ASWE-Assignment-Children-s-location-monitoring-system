const express = require('express');
const app = express();

app.use(express.json());

// ✅ for Arduino validation
app.get('/webhook', (req, res) => {
    res.send('Webhook OK');
});

// ✅ actual webhook
app.post('/webhook', (req, res) => {
    console.log("DATA:", req.body);
    res.status(200).send("OK");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});