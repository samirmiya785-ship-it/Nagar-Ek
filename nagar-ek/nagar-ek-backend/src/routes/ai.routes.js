const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GovernmentService = require("../models/government.model");

const router = express.Router();

router.get("/status", (req, res) => {
  res.json({ message: "AI service route is available." });
});

router.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });

  try {
    // Gather government services from DB only
    const services = await GovernmentService.find().lean();

    // Build a structured context string
    const servicesContext = services.map(s => {
      const subServices = s.providedServices?.map(ps =>
        `    - ${ps.name}: Documents required: ${ps.documentsRequired.join(", ")}`
      ).join("\n") || "    (No sub-services listed)";
      return `Department: ${s.name}
  Location: ${s.location}
  Hours: ${s.hours}
  About: ${s.description}
  Services Offered:\n${subServices}`;
    }).join("\n\n");

    const systemPrompt = `You are "Nagar-Ek Assistant", a friendly and helpful AI chatbot for the Nagar-Ek civic app in Kathmandu, Nepal.
You help citizens find information about government services, required documents, and office locations.
Be concise, accurate, and friendly. Always respond in the same language as the user (English or Nepali).
If a question is unrelated to government services, politely let the user know you can only assist with government service queries.

--- GOVERNMENT SERVICES DATA ---
${servicesContext}
--- END OF DATA ---
Only use the above data to answer questions. Do not fabricate information not present in the data.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Keyword-based fallback if no API key set yet
      const lower = message.toLowerCase();
      const matched = services.find(s =>
        s.name.toLowerCase().includes(lower) ||
        lower.includes(s.iconType) ||
        s.providedServices?.some(ps => ps.name.toLowerCase().includes(lower))
      );
      if (matched) {
        const subList = matched.providedServices?.map(ps =>
          `• ${ps.name}: ${ps.documentsRequired.join(", ")}`
        ).join("\n");
        return res.json({
          reply: `**${matched.name}**\n📍 ${matched.location}\n🕐 ${matched.hours}\n\nServices:\n${subList || "See office for details."}`
        });
      }
      return res.json({ reply: "I couldn't find information about that. Please ask about passport, driving license, birth registration, or document attestation." });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash-lite",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({});

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("[AI Chat Error]", err);
    res.status(500).json({ error: "AI service temporarily unavailable.", details: err.message });
  }
});

module.exports = router;
