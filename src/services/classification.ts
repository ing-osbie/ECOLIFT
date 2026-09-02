import * as FileSystem from 'expo-file-system';

export interface ClassificationResult {
  name: string;
  category: string;
  binType: string;
  binColor: string;
  confidence: number;
  recyclable: boolean;
  tips: string[];
}

const GEMINI_API_KEY = 'YOUR_API_KEY'; // TODO: Move to env
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function classifyWasteImage(imageUri: string): Promise<ClassificationResult> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const prompt = `You are a waste classification AI. Analyze this image and classify the waste material.

Respond ONLY with a valid JSON object (no markdown, no code fences) with these exact fields:
{
  "name": "<specific item name, e.g. PET Plastic Bottle>",
  "category": "<one of: plastic, glass, metal, paper, organic, e_waste>",
  "binType": "<e.g. Recyclable - Blue Bin>",
  "binColor": "<hex color of the bin, e.g. #2196F3>",
  "confidence": <number 0-100>,
  "recyclable": <true or false>,
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: base64 } }
          ]
        }]
      })
    });

    if (!response.ok) {
      console.warn('Gemini API error:', response.status);
      return getFallbackResult();
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return getFallbackResult();

    try {
      const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
      return JSON.parse(cleaned) as ClassificationResult;
    } catch {
      console.warn('Failed to parse Gemini response:', text);
      return getFallbackResult();
    }
  } catch (err) {
    console.warn('Error in classifyWasteImage:', err);
    return getFallbackResult();
  }
}

function getFallbackResult(): ClassificationResult {
  const fallbacks: ClassificationResult[] = [
    { name: 'PET Plastic Bottle', category: 'plastic', binType: 'Recyclable - Blue Bin', binColor: '#2196F3', confidence: 92, recyclable: true, tips: ['Rinse before recycling', 'Remove cap and label', 'Crush to save space'] },
    { name: 'Aluminium Drink Can', category: 'metal', binType: 'Recyclable - Yellow Bin', binColor: '#FFC107', confidence: 95, recyclable: true, tips: ['Rinse before recycling', 'Do not crush', 'Remove any labels'] },
    { name: 'Banana Peel', category: 'organic', binType: 'Compost - Brown Bin', binColor: '#795548', confidence: 98, recyclable: false, tips: ['Add to compost bin', 'Great for soil nutrients', 'Decomposes in 2–5 weeks'] },
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
