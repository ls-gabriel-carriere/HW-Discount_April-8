import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Slack Approval
  app.post("/api/approve", async (req, res) => {
    const { accountName, discount, payback, justification, funnel, salesPrice, mrr } = req.body;
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.warn("SLACK_WEBHOOK_URL not configured. Mocking success.");
      return res.json({ success: true, message: "Approval submitted (Mocked - No Webhook URL)" });
    }

    try {
      await axios.post(slackWebhookUrl, {
        text: `🚀 *New Hardware Discount Approval Request*\n\n*Account:* ${accountName}\n*Funnel:* ${funnel}\n*Discount:* ${discount.toFixed(2)}%\n*Payback:* ${payback.toFixed(2)} months\n*Sales Price:* $${salesPrice}\n*MRR:* $${mrr}\n\n*Justification:* ${justification}`,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Slack error:", error);
      res.status(500).json({ success: false, error: "Failed to send Slack notification" });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
