const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
app.use(cors());

// 🔹 Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 🔹 Twilio
const client = new twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_TOKEN
);

// 🔹 API
app.post("/api/lead", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    console.log("DATA RECEIVED:", req.body);

    // ✅ Save to Supabase
    const { error } = await supabase
      .from("leads")
      .insert([{ name, phone, email, message }]);

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({ success: false });
    }

    // ✅ Send WhatsApp (optional)
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

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// 🔹 Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});