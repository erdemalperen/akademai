const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Merhaba! Türkiye'nin başkenti nedir?";

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("Gemini API Test Sonucu:");
    console.log("-------------------------");
    console.log(text);
    console.log("-------------------------");
    console.log("Test başarılı! ✅");
    
  } catch (error) {
    console.error("Gemini API Test Hatası:");
    console.error("-------------------------");
    console.error(error);
    console.log("-------------------------");
    console.log("Test başarısız! ❌");
  }
}

testGemini();