const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const twilio = require("twilio");

const client = new twilio("AC4933a3267cff96da69655966e8baf9cb", "be012b62b75a7abcf86f86e568a06edf");

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
    return;
  }
  console.log("MySQL Connected");
});

app.post("/api/lead", async (req, res) => {
  const { name, phone, email, message } = req.body;

  const sql = "INSERT INTO leads (name, phone, email, message) VALUES (?, ?, ?, ?)";

  db.query(sql, [name, phone, email, message], async (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ success: false });
    }

    // 🔥 Send WhatsApp Alert AFTER DB success
    try {
      await client.messages.create({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+918778490290",
        body: `🔥 New Lead Received!

Name: ${name}
Phone: ${phone}
Email: ${email}
Message: ${message}`
      });
    } catch (error) {
      console.log("Twilio Error:", error.message);
    }

    res.json({ success: true });
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

app.get("/api/leads", (req, res) => {
  const sql = "SELECT * FROM leads ORDER BY created_at DESC";

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ success: false });
    }
    res.json(result);
  });
});