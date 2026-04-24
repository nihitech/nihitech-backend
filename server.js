const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ✅ Twilio (safe init)
let client;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
  client = new twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_TOKEN
  );
}

// ✅ POST Lead API
app.post("/api/lead", async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    console.log("DATA RECEIVED:", req.body);

    // 🔒 Basic validation
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // ✅ Insert into Supabase
    const { data, error } = await supabase
      .from("leads")
      .insert([{ name, phone, email, message }]);

    if (error) {
      console.log("SUPABASE ERROR:", error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    // ✅ Send WhatsApp (non-blocking)
    if (client) {
      client.messages.create({
        from: "whatsapp:+14155238886",
        to: "whatsapp:+918778490290",
        body: `🔥 New Lead Received!

Name: ${name}
Phone: ${phone}
Email: ${email}
Message: ${message}`
      }).catch(err => console.log("TWILIO ERROR:", err));
    }

    return res.json({ success: true });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});


// ✅ OPTIONAL: GET Leads (for admin panel)
app.get("/api/leads", async (req, res) => {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log("FETCH ERROR:", error);
    return res.status(500).json({ success: false });
  }

  console.log("LEADS FETCHED:", data.length);
  res.json(data);
});


// ✅ IMPORTANT: Use dynamic port for Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});