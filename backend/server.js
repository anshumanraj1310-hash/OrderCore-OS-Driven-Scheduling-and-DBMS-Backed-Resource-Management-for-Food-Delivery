const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("OrderCore Backend is Running");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
