import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { DigitizedMatchData, InningsData, DigitizedPlayer } from "../types/ai";

export type ProgressCallback = (stage: string, percent: number) => void;

const encodeFiles = async (files: File[]) =>
  Promise.all(
    files.map(async (file) => {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      return { inlineData: { data: base64, mimeType: file.type } };
    })
  );

const SUMMARY_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    matchInfo: {
      type: SchemaType.OBJECT,
      properties: {
        matchTitle: { type: SchemaType.STRING },
        tournament: { type: SchemaType.STRING },
        venue: { type: SchemaType.STRING },
        date: { type: SchemaType.STRING },
        matchFormat: { type: SchemaType.STRING },
        inningsCount: { type: SchemaType.NUMBER },
        isTestMatch: { type: SchemaType.BOOLEAN },
        toss: { type: SchemaType.STRING },
        winner: { type: SchemaType.STRING },
        matchSummaryText: { type: SchemaType.STRING },
      },
      required: ['matchTitle', 'winner', 'matchFormat'],
    },
    teams: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          score: { type: SchemaType.STRING },
          overs: { type: SchemaType.STRING },
          extras: {
            type: SchemaType.OBJECT,
            properties: {
              byes: { type: SchemaType.NUMBER },
              legByes: { type: SchemaType.NUMBER },
              wides: { type: SchemaType.NUMBER },
              noBalls: { type: SchemaType.NUMBER },
              total: { type: SchemaType.NUMBER },
            },
          },
        },
        required: ['name', 'score'],
      },
    },
  },
  required: ['matchInfo', 'teams'],
};

export const extractMatchData = async (files: File[], onProgress?: ProgressCallback): Promise<DigitizedMatchData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("VITE_GEMINI_API_KEY is not set.");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { 
      responseMimeType: "application/json",
      responseSchema: SUMMARY_SCHEMA as any
    },
  });

  onProgress?.('Encoding image...', 20);
  const parts = await encodeFiles(files);

  onProgress?.('Extracting match data...', 60);
  const prompt = `Extract match summary and team scores from this scorecard. Return JSON only.`;

  const result = await model.generateContent([prompt, ...parts]);
  const text = result.response.text();

  onProgress?.('Parsing results...', 90);
  try {
    return JSON.parse(text) as DigitizedMatchData;
  } catch {
    const cleaned = text.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(cleaned) as DigitizedMatchData;
  }
};
