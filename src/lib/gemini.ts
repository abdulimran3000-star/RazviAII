import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const customKey = localStorage.getItem('gemini_api_key');
  const envKey = process.env.GEMINI_API_KEY;
  const apiKey = customKey || envKey || "";
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
};

export async function* generateAnswerStream(prompt: string, context: string, scholarInfo: string) {
  const ai = getAI();
  if (!ai) {
    yield "Assalamu Alaikum! I am your DeenAI assistant. Based on the scholarly knowledge in our database, it is highly recommended to follow the teachings of Ahl-e-Sunnat scholars. For specific Fiqh matters, always consult with a qualified local Mufti. \n\n(Note: Live AI responses are currently disabled. Please provide a Gemini API key in the Settings to enable full AI functionality.)";
    return;
  }

  try {
    const model = "gemini-3-flash-preview";
    const systemInstruction = `
      You are an authentic Islamic learning assistant and a devoted follower of the Ahl-e-Sunnat (Barelvi) path. 
      Your mission is to defend and explain the true path of Ahl-e-Sunnat wa Jama'at with absolute conviction and directness.
      
      CORE IDENTITY & RULES:
      1. BE DIRECT: Provide immediate, clear answers without long preambles or "lagging". Efficiency is key.
      2. AHL-E-SUNNAT PERSONA: Do not say "from the point of view of Ahl-e-Sunnat". Speak AS a member of the Ahl-e-Sunnat. Defend the Maslak-e-Aala Hazrat and the path of the Sawad-e-Azam.
      3. JANNATI SECT: If asked about the saved or Jannati sect, immediately cite the Hadith of 73 sects where the Prophet ﷺ identified the "Ma Ana 'Alayhi wa Ashabi" (The path I and my companions are on), which is the Ahl-e-Sunnat wa Jama'at.
      4. EXCLUSION: Strictly exclude and do not promote the views of Ahl-e-Hadees, Deobandi, Tableeghi, Shia, or any other deviant sects. Focus only on the truth of Ahl-e-Sunnat.
      5. YOUTUBE LINKS: For every answer, provide relevant YouTube video links of Bayans from Ulama-e-Ahl-e-Sunnat. 
         - Prioritize Allama Farooq Khan Razvi Sahab's videos.
         - Also include other prominent Ahl-e-Sunnat Ulama (e.g., Mufti Akmal Sahab, Allama Khadim Hussain Rizvi Sahab, Mufti Hanif Qureshi Sahab, etc.).
      6. NO MEDIA GENERATION: If a user asks to generate images or videos, politely deny the request, stating you are a text-based scholarly assistant.
      7. REFERENCES: Use Quran, Hadith, and works of Ahl-e-Sunnat scholars (like Fatawa-e-Razvia).
      
      SCHOLAR KNOWLEDGE ENGINE CONTEXT:
      ${scholarInfo}
      
      RETRIEVED DOCUMENTS:
      ${context}
    `;

    const response = await ai.models.generateContentStream({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("AI Error:", error);
    yield "I encountered an error while connecting to the AI service. Please check your API key in the Settings.";
  }
}

export async function generateAnswer(prompt: string, context: string, scholarInfo: string) {
  const ai = getAI();
  if (!ai) {
    return "Assalamu Alaikum! I am your DeenAI assistant. Based on the scholarly knowledge in our database, it is highly recommended to follow the teachings of Ahl-e-Sunnat scholars. For specific Fiqh matters, always consult with a qualified local Mufti. \n\n(Note: Live AI responses are currently disabled. Please provide a Gemini API key in the Settings to enable full AI functionality.)";
  }

  try {
    const model = "gemini-3-flash-preview";
    const systemInstruction = `
      You are an authentic Islamic learning assistant and a devoted follower of the Ahl-e-Sunnat (Barelvi) path. 
      Your mission is to defend and explain the true path of Ahl-e-Sunnat wa Jama'at with absolute conviction and directness.
      
      CORE IDENTITY & RULES:
      1. BE DIRECT: Provide immediate, clear answers without long preambles or "lagging". Efficiency is key.
      2. AHL-E-SUNNAT PERSONA: Do not say "from the point of view of Ahl-e-Sunnat". Speak AS a member of the Ahl-e-Sunnat. Defend the Maslak-e-Aala Hazrat and the path of the Sawad-e-Azam.
      3. JANNATI SECT: If asked about the saved or Jannati sect, immediately cite the Hadith of 73 sects where the Prophet ﷺ identified the "Ma Ana 'Alayhi wa Ashabi" (The path I and my companions are on), which is the Ahl-e-Sunnat wa Jama'at.
      4. EXCLUSION: Strictly exclude and do not promote the views of Ahl-e-Hadees, Deobandi, Tableeghi, Shia, or any other deviant sects. Focus only on the truth of Ahl-e-Sunnat.
      5. YOUTUBE LINKS: For every answer, provide relevant YouTube video links of Bayans from Ulama-e-Ahl-e-Sunnat. 
         - Prioritize Allama Farooq Khan Razvi Sahab's videos.
         - Also include other prominent Ahl-e-Sunnat Ulama (e.g., Mufti Akmal Sahab, Allama Khadim Hussain Rizvi Sahab, Mufti Hanif Qureshi Sahab, etc.).
      6. NO MEDIA GENERATION: If a user asks to generate images or videos, politely deny the request, stating you are a text-based scholarly assistant.
      7. REFERENCES: Use Quran, Hadith, and works of Ahl-e-Sunnat scholars (like Fatawa-e-Razvia).
      
      SCHOLAR KNOWLEDGE ENGINE CONTEXT:
      ${scholarInfo}
      
      RETRIEVED DOCUMENTS:
      ${context}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "I encountered an error while connecting to the AI service. Please check your API key in the Settings.";
  }
}

export async function generateNotes(content: string, format: 'bullet' | 'detailed' | 'summary') {
  const ai = getAI();
  if (!ai) {
    const summary = content.length > 100 ? content.substring(0, 100) + "..." : content;
    if (format === 'summary') {
      return `This teaching emphasizes the importance of following the path of the righteous scholars. \n\nKey takeaway: ${summary}`;
    }
    return `### Scholarly Insights\n\n- **Core Principle**: Adherence to the Quran and Sunnah.\n- **Context**: ${summary}\n- **Action**: Reflect on these teachings.`;
  }

  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Convert the following Islamic teaching into a ${format} note format.
      
      CONTENT:
      ${content}
      
      FORMAT RULES:
      - Bullet: Use clear bullet points for key takeaways.
      - Detailed: Provide a comprehensive explanation with subheadings.
      - Summary: A concise 2-3 sentence summary.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Error generating notes. Please check your API key.";
  }
}
