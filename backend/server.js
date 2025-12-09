import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const { Pool } = pkg;
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});


const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
});


app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

   
    try {
      await transporter.sendMail({
        from: `"MiniProject" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Verification OTP",
        html: `
          <h2>Email Verification</h2>
          <p>Your OTP is: <b>${otp}</b></p>
          <p>This OTP will expire in 5 minutes.</p>
        `,
      });

      console.log("OTP email sent via Gmail");
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }

    
    await pool.query(
      `INSERT INTO users (username, email, password, otp_code, otp_expires, is_verified)
       VALUES ($1, $2, $3, $4, $5, FALSE)`,
      [username, email, password, otp, otpExpires]
    );

    res.json({ message: "User registered! OTP sent to your email." });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Error registering user" });
  }
});


app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    
    if (user.otp_code !== otp) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    
    if (new Date() > new Date(user.otp_expires)) {
      return res.status(400).json({ error: "OTP expired" });
    }

  
    await pool.query(
      "UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires = NULL WHERE email = $1",
      [email]
    );

    res.json({ message: "OTP verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error verifying OTP" });
  }
});


app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.is_verified) {
      return res
        .status(403)
        .json({ error: "Please verify your OTP before logging in." });
    }

    res.json({ message: "Login successful!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error logging in" });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
