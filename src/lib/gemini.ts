import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Managed via .env

const genAI = new GoogleGenerativeAI(API_KEY);

export interface ArticleSections {
  metodologia: string;
  resultados: string;
  introduccion: string;
  discusion: string;
  conclusion: string;
  abstract: string;
}

export async function generateScript(text: string): Promise<ArticleSections> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // Using the new 2.5 Flash Lite model

  const prompt = `Analiza el siguiente texto (un artículo científico) y extrae las siguientes secciones. Devuelve la respuesta ÚNICAMENTE como un objeto JSON válido (sin markdown, sin bloques de código) con la siguiente estructura:
  {
    "metodologia": "Resumen de la metodología (50-70 palabras)",
    "resultados": "Resumen de los resultados (50-70 palabras)",
    "introduccion": "Resumen de la introducción (50-70 palabras)",
    "discusion": "Resumen de la discusión (50-70 palabras)",
    "conclusion": "Resumen de la conclusión (50-70 palabras)",
    "abstract": "Resumen del abstract (50-70 palabras)"
  }

  El tono debe ser informativo, claro y narrativo, adecuado para un podcast.
  
  Texto:
  ${text}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const textResponse = response.text();

  try {
    // Clean up potential markdown code blocks if the model adds them despite instructions
    const cleanedText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Failed to parse JSON output", e);
    // Fallback if parsing fails - return raw text wrapped in a generic structure or throw
    throw new Error("Failed to generate structured data. Raw response: " + textResponse);
  }
}
