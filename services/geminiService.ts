import { GoogleGenAI, Type } from "@google/genai";
import { ObservationLog } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeObservation = async (
  base64Image: string,
  date: string,
  location: string
): Promise<string> => {
  try {
    const ai = getAIClient();
    
    // Clean base64 string if it has the prefix
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `
      你是一位资深的天文学家和天文摄影评论家。
      我在 ${location} 于 ${date} 拍摄了这次月相观测照片。
      
      请分析这张照片：
      1. 确认这是否为月亮，并识别当前可见的月相。
      2. 请给这张照片的拍摄质量打分（1-10分，基于业余观测标准）。
      3. 提供一段关于此月相的简短科学事实或充满诗意的描述。
      
      请保持回复简洁（100字以内）。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "无法生成分析结果。";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "暂时无法分析图片，请检查网络或 API Key 设置。";
  }
};

export const getMoonTrivia = async (phaseName: string): Promise<string> => {
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `请告诉我关于“${phaseName}”的一个简短且有趣的科学事实（一句话）。`
        });
        return response.text || "月球每年大约远离地球 3.8 厘米。";
    } catch (e) {
        return "月球每年大约远离地球 3.8 厘米。";
    }
};

export const searchLocation = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find the latitude and longitude for the city/place: "${query}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Latitude of the location" },
            lng: { type: Type.NUMBER, description: "Longitude of the location" },
            name: { type: Type.STRING, description: "Standard formatted name of the city in Chinese (e.g. '中国北京市')" }
          },
          required: ["lat", "lng", "name"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Location Search Error:", error);
    return null;
  }
};
