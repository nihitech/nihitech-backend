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
  try {
    const { name, phone, email, message } = req.body;

    console.log("DATA RECEIVED:", req.body);

    // 🔹 Save to DB FIRST
    const sql = "INSERT INTO leads (name, phone, email, message) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, phone, email, message], async (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ success: false });
      }

      // 🔹 Send WhatsApp (optional, don't break API)
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
      } catch (twilioErr) {
        console.log("TWILIO ERROR:", twilioErr);
      }

      res.json({ success: true });
    });

  } catch (error) {
    console.log("SERVER ERROR:", error);
    res.status(500).json({ success: false });
  }
});