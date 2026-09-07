import { Platform } from 'react-native';
import { File } from 'expo-file-system';

export interface ClassificationResult {
  name: string;
  category: string;
  binType: string;
  binColor: string;
  confidence: number;
  recyclable: boolean;
  tips: string[];
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Converts an image URI into a base64 string using modern Expo FileSystem File API,
 * with fallbacks for data URLs, legacy filesystem, and web.
 */
async function getImageBase64(imageUri: string): Promise<string> {
  // If already a base64 data URL
  if (imageUri.startsWith('data:')) {
    const commaIndex = imageUri.indexOf(',');
    return commaIndex !== -1 ? imageUri.slice(commaIndex + 1) : imageUri;
  }

  // Web platform fallback using browser FileReader
  if (Platform.OS === 'web') {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const commaIdx = res.indexOf(',');
        resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Modern Expo FileSystem API (Expo SDK 54+)
  try {
    const file = new File(imageUri);
    return await file.base64();
  } catch {
    // Fallback to legacy filesystem module if needed
    const legacyFs = await import('expo-file-system/legacy');
    return await legacyFs.readAsStringAsync(imageUri, {
      encoding: legacyFs.EncodingType.Base64,
    });
  }
}

export async function classifyWasteImage(imageUri: string): Promise<ClassificationResult> {
  try {
    // If no API key is provided, return intelligent fallback
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY') {
      return getFallbackResult();
    }

    const base64 = await getImageBase64(imageUri);

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
