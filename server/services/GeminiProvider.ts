import { AIProvider } from "../interfaces/AIProvider.js";
import { GoogleGenAI, Type } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

const itinerarySchema = {
  type: Type.OBJECT,
  properties: {
    destination: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.NUMBER },
          title: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["day", "title", "activities"],
      },
    },
    budget: {
      type: Type.OBJECT,
      properties: {
        flights: { type: Type.NUMBER },
        accommodation: { type: Type.NUMBER },
        food: { type: Type.NUMBER },
        activities: { type: Type.NUMBER },
        transportation: { type: Type.NUMBER },
        total: { type: Type.NUMBER },
      },
      required: ["flights", "accommodation", "food", "activities", "transportation", "total"],
    },
    hotels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "category", "description"],
      },
      description: "Must include 3 options: Budget, Mid Range, Luxury",
    },
    travelTips: {
      type: Type.OBJECT,
      properties: {
        packing: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        safety: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        localEtiquette: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        weatherAdvice: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["packing", "safety", "localEtiquette", "weatherAdvice"],
    },
  },
  required: ["destination", "days", "budget", "hotels", "travelTips"],
};

export class GeminiProvider implements AIProvider {
  async generateItinerary(params: {
    destination: string;
    numberOfDays: number;
    budgetType: string;
    interests: string[];
  }) {
    const ai = getGeminiClient();

    const prompt = `Create a realistic travel itinerary for ${params.destination} for ${params.numberOfDays} days. 
    The budget is ${params.budgetType}. 
    Interests include: ${params.interests.join(", ")}. 
    Please include a realistic budget estimation in USD, 3 hotel recommendations (Budget, Mid Range, Luxury), and useful travel tips.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: itinerarySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return JSON.parse(text);
  }

  async regenerateDay(params: {
    destination: string;
    budgetType: string;
    interests: string[];
    currentDayData: any;
    userInstruction: string;
  }) {
    const ai = getGeminiClient();

    const prompt = `You are updating a specific day in a travel itinerary for ${params.destination}. 
    Budget: ${params.budgetType}. Interests: ${params.interests.join(", ")}.
    Current day data: ${JSON.stringify(params.currentDayData)}
    User instruction for changes: "${params.userInstruction}"
    
    Return ONLY the updated day object in the same structure (day number, title, activities array).`;

    const daySchema = {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.NUMBER },
        title: { type: Type.STRING },
        activities: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
      required: ["day", "title", "activities"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: daySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    return JSON.parse(text);
  }
}
