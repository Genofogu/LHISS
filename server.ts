import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock email transporter
  // In a real app, use real SMTP credentials in .env
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "mock_user",
      pass: process.env.SMTP_PASS || "mock_pass",
    },
  });

  // API Route to send notification
  app.post("/api/notify", async (req, res) => {
    const { email, name, opportunities } = req.body;

    if (!email || !opportunities || opportunities.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const opportunitiesHtml = opportunities.map((opp: any) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="margin: 0 0 5px 0; color: #1e293b;">${opp.title}</h3>
        <p style="margin: 0; color: #64748b; font-size: 14px;">${opp.company} • ${opp.location}</p>
        <p style="margin: 5px 0 0 0; color: #8b5cf6; font-weight: bold; font-size: 12px;">Match Score: ${opp.matchScore}%</p>
      </div>
    `).join("");

    const mailOptions = {
      from: '"LHISS Intelligence" <notifications@lhiss.ai>',
      to: email,
      subject: `New Opportunities Found for ${name}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #7c3aed;">New Matches Found!</h1>
          <p>Hi ${name}, we found some new opportunities that match your skill profile:</p>
          ${opportunitiesHtml}
          <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
            You are receiving this because you enabled email notifications in your LHISS settings.
          </p>
        </div>
      `,
    };

    try {
      // For demo purposes, we'll just log it if credentials are mock
      if (process.env.SMTP_USER === "mock_user") {
        console.log("MOCK EMAIL SENT TO:", email);
        console.log("SUBJECT:", mailOptions.subject);
        return res.json({ success: true, message: "Mock email logged to console" });
      }

      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Notification sent" });
    } catch (error) {
      console.error("Email error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
