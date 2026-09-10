import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { Platform } from "react-native";
import { supabase } from "@/src/lib/supabase";

export type WasteCategory =
  | "plastic"
  | "metal"
  | "e_waste"
  | "paper"
  | "glass"
  | "organic"
  | "textiles"
  | "hazardous"
  | "non_waste"
  | "unknown"
  | "other";

export type ConfidenceLevel = "high" | "medium" | "low";
export type ClassificationErrorCode =
  | "NO_INTERNET"
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "INVALID_IMAGE"
  | "INVALID_AI_RESPONSE"
  | "SERVER_ERROR"
  | "UNKNOWN_ERROR";

export interface PredictionAlternative {
  label: string;
  category: WasteCategory;
  confidence: number; // 0 - 100 percentage
}

export interface ClassificationResult {
  id?: string;
  name: string;
  objectType: string;
  material: string;
  category: WasteCategory;
  subCategory?: string;
  binType: string;
  binColor: string;
  confidence: number; // Actual model confidence (0-100)
  confidenceLevel: ConfidenceLevel;
  recyclable: boolean;
  isWaste: boolean;
  estimatedWeightGrams: number;
  co2SavingsKg: number;
  ecoPoints: number;
  tips: string[];
  disposalRecommendation: string;
  aiModelUsed: string;
  alternatives: PredictionAlternative[];
  reason?: string;
  errorCode?: ClassificationErrorCode;
  error?: string;
}

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 90,
  MEDIUM: 75,
  LOW: 75,
};

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return "high";
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return "medium";
  return "low";
}

export interface CategoryMetadata {
  displayName: string;
  binType: string;
  binColor: string;
  recyclable: boolean;
  isWaste: boolean;
  defaultWeightGrams: number;
  defaultCo2SavingsKg: number;
  defaultEcoPoints: number;
  defaultTips: string[];
  defaultDisposalRecommendation: string;
}

export const CATEGORY_METADATA_MAP: Record<WasteCategory, CategoryMetadata> = {
  e_waste: {
    displayName: "Electronic Waste",
    binType: "E-Waste Depot / Special Drop-Off",
    binColor: "#7C3AED",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 450,
    defaultCo2SavingsKg: 2.1,
    defaultEcoPoints: 50,
    defaultTips: [
      "Take to an approved e-waste drop-off point or schedule an EcoLift collection",
      "Never dispose of electronics in curbside recycling or general trash bins",
      "Back up personal data and remove any detachable batteries before drop-off",
    ],
    defaultDisposalRecommendation:
      "Take to an authorized e-waste collection center or schedule an EcoLift pickup. Electronics contain precious metals and toxic materials that require certified dismantling.",
  },
  metal: {
    displayName: "Metal",
    binType: "Recyclable - Yellow Bin",
    binColor: "#D97706",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 20,
    defaultCo2SavingsKg: 0.18,
    defaultEcoPoints: 30,
    defaultTips: [
      "100% endlessly recyclable without loss of structural quality",
      "Rinse liquid and food residue before placing in recycling",
      "Do not detach aluminium pull-tabs; crush cans to save space",
    ],
    defaultDisposalRecommendation:
      "Rinse clean and place in your curbside mixed or metal recycling bin (Yellow Bin).",
  },
  plastic: {
    displayName: "Plastic Packaging",
    binType: "Plastics & Containers - Yellow Bin",
    binColor: "#006C49",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 30,
    defaultCo2SavingsKg: 0.08,
    defaultEcoPoints: 25,
    defaultTips: [
      "Empty and rinse liquids/residue completely",
      "Keep screw caps on bottles for automated optical sorting",
      "Crush bottles horizontally to minimize bin volume",
    ],
    defaultDisposalRecommendation:
      "Rinse and place in your curbside plastic recycling bin (Yellow Bin). Check resin code (#1 PET, #2 HDPE, #5 PP are widely accepted).",
  },
  paper: {
    displayName: "Paper & Cardboard",
    binType: "Paper & Cardboard - Blue Bin",
    binColor: "#2563EB",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 120,
    defaultCo2SavingsKg: 0.22,
    defaultEcoPoints: 25,
    defaultTips: [
      "Flatten all cardboard boxes completely to maximize bin capacity",
      "Keep dry; wet or greasy paper (e.g. greasy pizza boxes) cannot be recycled",
      "Remove non-paper packaging materials like plastic bubble wrap and heavy tape",
    ],
    defaultDisposalRecommendation:
      "Flatten and place in the paper and cardboard recycling bin (Blue Bin). Ensure materials are clean and dry.",
  },
  glass: {
    displayName: "Glass Container",
    binType: "Glass - Green Bin",
    binColor: "#059669",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 220,
    defaultCo2SavingsKg: 0.32,
    defaultEcoPoints: 35,
    defaultTips: [
      "Endlessly recyclable into new bottles and jars without loss in purity",
      "Rinse clean; labels may remain on containers",
      "Do not mix with mirrors, window panes, Pyrex, or ceramic tableware",
    ],
    defaultDisposalRecommendation:
      "Rinse and place in your glass bottle bank or curbside glass recycling bin (Green Bin).",
  },
  organic: {
    displayName: "Organic / Compost",
    binType: "Organic & Compost - Brown Bin",
    binColor: "#78350F",
    recyclable: false,
    isWaste: true,
    defaultWeightGrams: 100,
    defaultCo2SavingsKg: 0.06,
    defaultEcoPoints: 20,
    defaultTips: [
      "Excellent for home composting or municipal food waste collection",
      "Decomposes aerobically into nutrient-dense soil amendment",
      "Ensure all plastic stickers, rubber bands, and plastic packaging are removed",
    ],
    defaultDisposalRecommendation:
      "Place in your green/brown organic compost bin or backyard composting system. Keep free of plastics and wrappers.",
  },
  textiles: {
    displayName: "Textiles & Clothing",
    binType: "Textile Bank / Donation",
    binColor: "#EC4899",
    recyclable: true,
    isWaste: true,
    defaultWeightGrams: 280,
    defaultCo2SavingsKg: 1.4,
    defaultEcoPoints: 30,
    defaultTips: [
      "If clean and wearable, donate to local charity shops or community drives",
      "Wash and dry garments thoroughly before placing in textile drop boxes",
      "Torn or worn-out fabrics can be repurposed as cleaning rags or textile insulation",
    ],
    defaultDisposalRecommendation:
      "Donate wearable garments to charity, or take damaged fabrics to a designated textile recycling drop-off bank.",
  },
  hazardous: {
    displayName: "Hazardous / Special Waste",
    binType: "Hazardous Waste Facility - Red Bin",
    binColor: "#DC2626",
    recyclable: false,
    isWaste: true,
    defaultWeightGrams: 60,
    defaultCo2SavingsKg: 0.05,
    defaultEcoPoints: 15,
    defaultTips: [
      "NEVER dispose in household trash or curbside recycling bins",
      "For batteries: tape terminals with electrical tape to prevent short circuits",
      "Take to a designated supermarket battery kiosk or municipal HHW drop-off depot",
    ],
    defaultDisposalRecommendation:
      "Take to a certified household hazardous waste (HHW) drop-off facility or dedicated battery recycling kiosk. Never place in standard bins.",
  },
  non_waste: {
    displayName: "Non-Waste Object",
    binType: "Not Waste",
    binColor: "#6B7280",
    recyclable: false,
    isWaste: false,
    defaultWeightGrams: 0,
    defaultCo2SavingsKg: 0,
    defaultEcoPoints: 0,
    defaultTips: [
      "This object is identified as a reusable item, person, pet, or indoor scene",
      "Ensure the waste or recyclable item is centered and in clear focus",
      "Retake photo focusing solely on the discarded packaging or item",
    ],
    defaultDisposalRecommendation:
      "This item is not identified as disposable waste. Continue using and maintaining it.",
  },
  unknown: {
    displayName: "Unclassified Item",
    binType: "Manual Sorting Required",
    binColor: "#6B7280",
    recyclable: false,
    isWaste: true,
    defaultWeightGrams: 0,
    defaultCo2SavingsKg: 0,
    defaultEcoPoints: 0,
    defaultTips: [
      "Place the item against a clean, neutral background",
      "Ensure bright, direct lighting and avoid severe shadows or glare",
      "Focus directly on the object or its recycling symbol / resin code",
    ],
    defaultDisposalRecommendation:
      "Unable to identify this item with sufficient confidence. Please retake the photo in better lighting or consult your local municipal waste directory.",
  },
  other: {
    displayName: "General Waste / Other",
    binType: "General Waste - Black Bin",
    binColor: "#374151",
    recyclable: false,
    isWaste: true,
    defaultWeightGrams: 50,
    defaultCo2SavingsKg: 0.02,
    defaultEcoPoints: 10,
    defaultTips: [
      "Check if item consists of composite mixed materials that cannot be separated",
      "If not recyclable, place in standard general residual waste bin",
      "Look for manufacturer recycling instructions on packaging",
    ],
    defaultDisposalRecommendation:
      "Place in general residual waste bin (Black Bin) if materials cannot be separated for recycling.",
  },
};

// Supported Gemini multimodal vision models in preference order
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

export const GEMINI_STORAGE_KEY = "@ecolift_gemini_api_key";

export async function getGeminiApiKey(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(GEMINI_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch (err) {
    if (__DEV__) {
      console.warn("[EcoLift AI] Failed reading Gemini key from AsyncStorage:", err);
    }
  }
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return "";
}

export async function getGeminiKeySource(): Promise<"storage" | "env" | "none"> {
  try {
    const stored = await AsyncStorage.getItem(GEMINI_STORAGE_KEY);
    if (stored && stored.trim()) return "storage";
  } catch {}
  const envKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (envKey && envKey.trim()) return "env";
  return "none";
}

export async function setGeminiApiKey(key: string): Promise<void> {
  const trimmed = key ? key.trim() : "";
  if (!trimmed) {
    await AsyncStorage.removeItem(GEMINI_STORAGE_KEY);
    return;
  }
  await AsyncStorage.setItem(GEMINI_STORAGE_KEY, trimmed);
}

export async function clearGeminiApiKey(): Promise<void> {
  await AsyncStorage.removeItem(GEMINI_STORAGE_KEY);
}

/**
 * Validates a Gemini API key by making a lightweight test query to the API
 */
export async function testGeminiApiKey(
  apiKey: string,
): Promise<{ success: boolean; error?: string }> {
  const keyToTest = apiKey?.trim();
  if (!keyToTest) {
    return { success: false, error: "API key cannot be empty." };
  }

  let lastError = "Could not validate key.";

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(keyToTest)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: "Respond with the word OK." }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { success: true };
      }

      const errJson = await res.json().catch(() => ({}));
      const rawMessage =
        errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;

      if (res.status === 400 || res.status === 403) {
        return { success: false, error: `Invalid API key: ${rawMessage}` };
      }
      if (res.status === 429) {
        return { success: false, error: "Rate limit reached for this API key." };
      }
      lastError = rawMessage;
    } catch (e: any) {
      if (e?.name === "AbortError") {
        return { success: false, error: "Request timed out while validating API key." };
      }
      lastError = e?.message || "Network error while connecting to Gemini API.";
    }
  }

  return { success: false, error: lastError };
}

/**
 * Inspect image URI to determine the most accurate MIME type
 */
export function getImageMimeType(uri: string): string {
  if (uri.startsWith("data:image/png")) return "image/png";
  if (uri.startsWith("data:image/webp")) return "image/webp";
  if (uri.startsWith("data:image/heic") || uri.startsWith("data:image/heif"))
    return "image/heic";
  const clean = uri.toLowerCase().split("?")[0];
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".heic") || clean.endsWith(".heif")) return "image/heic";
  return "image/jpeg";
}

/**
 * Converts an image URI into a base64 string using modern Expo FileSystem File API,
 * with fallbacks for data URLs, legacy filesystem, and web.
 */
export async function getImageBase64(imageUri: string): Promise<string> {
  if (!imageUri || typeof imageUri !== "string") {
    throw new Error("Invalid or empty image URI provided for preprocessing.");
  }

  // If already a base64 data URL
  if (imageUri.startsWith("data:")) {
    const commaIndex = imageUri.indexOf(",");
    return commaIndex !== -1 ? imageUri.slice(commaIndex + 1) : imageUri;
  }

  // Web platform fallback using browser fetch + FileReader
  if (Platform.OS === "web") {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const res = reader.result as string;
        const commaIdx = res.indexOf(",");
        resolve(commaIdx !== -1 ? res.slice(commaIdx + 1) : res);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Modern Expo FileSystem API (Expo SDK 54+)
  try {
    const file = new File(imageUri);
    const base64 = await file.base64();
    if (base64 && base64.length > 50) {
      return base64;
    }
  } catch {
    // Fall back to legacy FileSystem if File API throws
  }

  try {
    const legacyFs = await import("expo-file-system/legacy");
    return await legacyFs.readAsStringAsync(imageUri, {
      encoding: legacyFs.EncodingType.Base64,
    });
  } catch (err: any) {
    throw new Error(
      `Failed to preprocess and read image data: ${err?.message || err}`,
    );
  }
}

const SYSTEM_PROMPT = `You are EcoLift's precision waste-material classification AI.
Analyze the provided image carefully and classify the PRIMARY physical material and waste category of the main visible item.

CRITICAL INSTRUCTIONS & MATERIAL DISCRIMINATION:
1. Identify the primary physical material, not just the object's general shape.
2. Examine surface texture, reflections, seams, labels, threading, structural rigidity, components, and all visible evidence.
3. STRICT CATEGORY RULES:
   - PLASTIC BOTTLE vs. GLASS BOTTLE: Clear thin PET with molded recycling triangles, neck ridges, and lightweight flexibility is "plastic". Rigid silicate glass with characteristic refraction, thick weighted bottom, and glass seams is "glass".
   - METAL CAN vs. PLASTIC CONTAINER: Metallic luster, crimped top/bottom rims, pull-tab lids, or tin-plated seams belong to "metal".
   - PAPER vs. CARDBOARD: Both belong to category "paper". Use subCategory "cardboard" for fluted/corrugated boxes and cartons; use subCategory "paper" for office sheets, flyers, and magazines.
   - E-WASTE vs. GENERIC PLASTIC OR METAL: Any electronic device (laptop, computer, tablet, smartphone, keyboard, mouse, monitor, power adapter, charger, USB cable, headphones, audio equipment, circuit board) MUST be classified as category "e_waste", NEVER generic "plastic" or "metal". Electronics contain hazardous components (lead, mercury) and valuable recoverable metals (gold, copper, lithium) requiring certified dismantling at e-waste depots.
   - BATTERIES vs. GENERAL E-WASTE / TRASH: Batteries (alkaline AA/AAA/9V, lithium-ion pouch/cells, button cells) MUST be classified as category "hazardous". They cause explosive fires in standard recycling facilities and must NEVER be placed in curbside recycling or trash.
   - ORGANIC vs. PACKAGING: Food scraps, vegetable peels, fruit waste, eggshells, coffee grounds, and compostable plant matter are category "organic", NOT recyclable waste.
   - TEXTILES: Clothing, fabrics, shoes, towels, linens are category "textiles".
   - NON-WASTE: Living animals/pets, people, faces, clean furniture in active use, vehicles, or outdoor scenery are "non_waste".
   - UNKNOWN: Blurry, out-of-focus, occluded, or unidentifiable items must be classified as "unknown".
4. HONEST CONFIDENCE SCORING:
   - Provide a realistic decimal confidence between 0.00 and 1.00 (e.g. 0.94).
   - If confidence is below 0.75 (75%), return category "unknown" and explain what visual detail is missing. Prefer "unknown" over hallucinating.
5. DISPOSAL ADVICE:
   - Provide safety-accurate, category-specific disposal advice. E.g. E-waste: "Take to an authorized e-waste drop-off kiosk or schedule an EcoLift collection. Do not place in household curbside bins." Batteries: "Take to a dedicated battery drop-off kiosk or hazardous waste center. Never put in trash or curbside recycling."

Return ONLY valid JSON matching this schema:
{
  "name": "<Specific object name, e.g. Clear PET Beverage Bottle, MacBook Pro Laptop, Aluminium Soda Can>",
  "item": "<Primary item>",
  "objectType": "<bottle|can|box|laptop|phone|keyboard|battery|clothing|food_waste|cable|appliance|etc>",
  "material": "<Specific Material, e.g. Polyethylene Terephthalate (PET #1), Aluminium Alloy 3004, Corrugated Kraft Cardboard, Circuit Boards & Aluminium Chassis, Zinc-Manganese Alkaline>",
  "category": "<e_waste|metal|plastic|paper|glass|organic|textiles|hazardous|non_waste|unknown|other>",
  "subCategory": "<e.g. pet_1, aluminium, steel, cardboard, paper, clear_glass, laptop, mobile_phone, keyboard, battery, food_waste, clothing>",
  "confidence": <number 0.0 to 1.0>,
  "recyclable": <boolean>,
  "isWaste": <boolean>,
  "estimatedWeightGrams": <number>,
  "co2SavingsKg": <number>,
  "ecoPoints": <integer 0 to 50>,
  "tips": ["<Actionable preparation tip 1>", "<Actionable preparation tip 2>", "<Actionable preparation tip 3>"],
  "reason": "<Visible physical features justifying this classification>",
  "disposalRecommendation": "<Accurate, safe disposal recommendation>",
  "alternatives": [
    { "label": "<Alternative candidate>", "category": "<category>", "confidence": <integer 0-100> }
  ]
}`;

export function getClassificationErrorResult(
  errorCode: ClassificationErrorCode,
  reason: string,
): ClassificationResult {
  const meta = CATEGORY_METADATA_MAP.unknown;
  const isMissingKey = errorCode === "MISSING_API_KEY";
  const isOffline = errorCode === "NO_INTERNET";
  return {
    name: isMissingKey
      ? "AI Configuration Required"
      : isOffline
        ? "Internet connection required"
        : "AI identification unavailable",
    objectType: "unidentified",
    material: "Unknown Material",
    category: "unknown",
    subCategory: "unknown",
    binType: meta.binType,
    binColor: meta.binColor,
    confidence: 0,
    confidenceLevel: "low",
    recyclable: false,
    isWaste: true,
    estimatedWeightGrams: 0,
    co2SavingsKg: 0,
    ecoPoints: 0,
    tips: [
      isMissingKey
        ? "Configure a Gemini API key before analyzing an image"
        : "Reconnect to Wi-Fi or cellular data and retry the analysis",
      "Ensure the item is well-lit and centered in the frame before capturing",
      "Retake the photo if the item is small, blurry, or obstructed",
    ],
    disposalRecommendation: isMissingKey
      ? "Connect EcoLift to a configured Gemini API key to identify waste."
      : isOffline
        ? "EcoLift's AI identification currently requires an internet connection."
        : reason,
    aiModelUsed: "Gemini Vision unavailable",
    alternatives: [],
    errorCode,
    error: reason,
  };
}

export function getOfflineUnavailableResult(
  reason?: string,
): ClassificationResult {
  return getClassificationErrorResult(
    "NO_INTERNET",
    reason || "Internet connection required.",
  );
}

export function getUncertainResult(
  partialName = "Unable to identify item",
  partialMaterial = "Uncertain / Unclassified",
  confidence = 35,
  alternatives: PredictionAlternative[] = [],
): ClassificationResult {
  const meta = CATEGORY_METADATA_MAP.unknown;
  return {
    name: partialName,
    objectType: "uncertain",
    material: partialMaterial,
    category: "unknown",
    subCategory: "unknown",
    binType: meta.binType,
    binColor: meta.binColor,
    confidence: Math.max(0, Math.min(74, confidence)),
    confidenceLevel: "low",
    recyclable: false,
    isWaste: true,
    estimatedWeightGrams: 0,
    co2SavingsKg: 0,
    ecoPoints: 0,
    tips: [
      "Retake the photo against a plain, contrasting background",
      "Ensure bright, direct lighting and avoid severe glare or shadows",
      "Center the object inside the reticle and capture any visible labels",
    ],
    disposalRecommendation:
      "The AI could not identify this material with at least 75% confidence. Please retake the photo in good lighting.",
    aiModelUsed: "Gemini Vision AI",
    alternatives,
  };
}

export function enrichClassificationResult(
  raw: Record<string, unknown>,
  modelName: string,
): ClassificationResult {
  // Validate category against taxonomy
  const rawCat = String(raw?.category || "")
    .toLowerCase()
    .trim();
  const normalizedCategory =
    rawCat === "cardboard"
      ? "paper"
      : rawCat === "electronic"
        ? "e_waste"
        : rawCat;
  const category: WasteCategory = (
    Object.keys(CATEGORY_METADATA_MAP).includes(normalizedCategory)
      ? normalizedCategory
      : "other"
  ) as WasteCategory;

  const meta = CATEGORY_METADATA_MAP[category] || CATEGORY_METADATA_MAP.other;

  // Real confidence parsing without artificial clamping (Requirement 4)
  let rawConfidence = Number(raw?.confidence);
  if (isNaN(rawConfidence) || rawConfidence <= 0) {
    rawConfidence = 0;
  } else if (rawConfidence > 0 && rawConfidence <= 1) {
    // Model returned decimal (e.g. 0.94 -> 94)
    rawConfidence = Math.round(rawConfidence * 100);
  } else {
    rawConfidence = Math.round(Math.min(100, Math.max(0, rawConfidence)));
  }

  const confidenceLevel = getConfidenceLevel(rawConfidence);

  // Parse alternatives
  const alternatives: PredictionAlternative[] = [];
  if (Array.isArray(raw?.alternatives)) {
    for (const alt of raw.alternatives.slice(0, 3)) {
      if (alt && alt.label) {
        let altConf = Number(alt.confidence);
        if (isNaN(altConf)) altConf = 0;
        else if (altConf > 0 && altConf <= 1)
          altConf = Math.round(altConf * 100);
        else altConf = Math.round(Math.min(100, Math.max(0, altConf)));

        const altCat = String(alt.category || "")
          .toLowerCase()
          .trim();
        const validAltCat: WasteCategory = (
          Object.keys(CATEGORY_METADATA_MAP).includes(altCat) ? altCat : "other"
        ) as WasteCategory;

        alternatives.push({
          label: String(alt.label),
          category: validAltCat,
          confidence: altConf,
        });
      }
    }
  }

  // If confidence is low (< 60%) or category is unknown, apply safety thresholding (Requirement 5, 16)
  if (confidenceLevel === "low" || category === "unknown") {
    return {
      name: raw?.name
        ? `Uncertain: ${String(raw.name)}`
        : "Unable to confidently identify item",
      objectType: String(raw?.objectType || "uncertain"),
      material: String(raw?.material || "Uncertain / Mixed Material"),
      category: "unknown",
      subCategory: String(raw?.subCategory || "unknown"),
      binType: meta.binType,
      binColor: meta.binColor,
      confidence: rawConfidence,
      confidenceLevel: "low",
      recyclable: false,
      isWaste: raw?.isWaste !== false,
      estimatedWeightGrams:
        Number(raw?.estimatedWeightGrams) || meta.defaultWeightGrams,
      co2SavingsKg: Number(raw?.co2SavingsKg) || meta.defaultCo2SavingsKg,
      ecoPoints: 0,
      tips:
        Array.isArray(raw?.tips) && raw.tips.length > 0
          ? raw.tips.slice(0, 3)
          : meta.defaultTips,
      disposalRecommendation:
        typeof raw?.disposalRecommendation === "string"
          ? raw.disposalRecommendation
          : meta.defaultDisposalRecommendation,
      aiModelUsed: modelName,
      alternatives,
      reason: typeof raw?.reason === "string" ? raw.reason : undefined,
    };
  }

  return {
    name: String(raw?.name || meta.displayName),
    objectType: String(raw?.objectType || category),
    material: String(raw?.material || "Mixed Materials"),
    category,
    subCategory: raw?.subCategory ? String(raw.subCategory) : undefined,
    binType: raw?.binType ? String(raw.binType) : meta.binType,
    binColor: raw?.binColor ? String(raw.binColor) : meta.binColor,
    confidence: rawConfidence,
    confidenceLevel,
    recyclable:
      raw?.recyclable !== undefined ? Boolean(raw.recyclable) : meta.recyclable,
    isWaste: raw?.isWaste !== undefined ? Boolean(raw.isWaste) : meta.isWaste,
    estimatedWeightGrams:
      Number(raw?.estimatedWeightGrams) || meta.defaultWeightGrams,
    co2SavingsKg: Number(raw?.co2SavingsKg) || meta.defaultCo2SavingsKg,
    ecoPoints: Number(raw?.ecoPoints) || meta.defaultEcoPoints,
    tips:
      Array.isArray(raw?.tips) && raw.tips.length > 0
        ? raw.tips.slice(0, 3)
        : meta.defaultTips,
    disposalRecommendation:
      typeof raw?.disposalRecommendation === "string"
        ? raw.disposalRecommendation
        : meta.defaultDisposalRecommendation,
    aiModelUsed: modelName,
    alternatives,
    reason: typeof raw?.reason === "string" ? raw.reason : undefined,
  };
}

/**
 * Classifies an image using Google Gemini Vision AI,
 * enforcing honest confidence calculation, confidence thresholding, and safe offline handling.
 */
/**
 * Safely parses raw Gemini response text into a JSON object, stripping markdown fences
 * and locating outermost JSON brackets if preamble or postamble text exists.
 */
export function parseGeminiJsonResponse(
  rawText: string,
): Record<string, unknown> | null {
  if (!rawText || typeof rawText !== "string") return null;

  // 1. Strip markdown fences if present
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // 2. Try to locate outermost json braces if extraneous text was returned
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Direct call to Google Generative Language REST API for Gemini Vision
 */
export async function callGeminiVisionDirect(
  base64: string,
  mimeType: string,
  apiKey: string,
  model: string,
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
  errorCode?: ClassificationErrorCode;
}> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      return { success: true, data: json };
    }

    const errMessage =
      json?.error?.message || `HTTP ${res.status}: ${res.statusText}`;

    if (res.status === 400) {
      const lower = errMessage.toLowerCase();
      if (lower.includes("key") || lower.includes("api_key")) {
        return { success: false, error: errMessage, errorCode: "INVALID_API_KEY" };
      }
      return { success: false, error: errMessage, errorCode: "INVALID_IMAGE" };
    }
    if (res.status === 403) {
      return { success: false, error: errMessage, errorCode: "INVALID_API_KEY" };
    }
    if (res.status === 429) {
      return {
        success: false,
        error: "Gemini rate limit exceeded. Please wait a moment and retry.",
        errorCode: "RATE_LIMIT",
      };
    }
    if (res.status === 404) {
      return {
        success: false,
        error: `Model ${model} not found or unsupported.`,
        errorCode: "SERVER_ERROR",
      };
    }

    return { success: false, error: errMessage, errorCode: "SERVER_ERROR" };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      return {
        success: false,
        error: "Gemini vision analysis timed out.",
        errorCode: "TIMEOUT",
      };
    }
    return {
      success: false,
      error: err?.message || "Network error connecting to Gemini AI.",
      errorCode: "NO_INTERNET",
    };
  }
}

/**
 * Classifies an image using Google Gemini Vision AI with multi-tier fallback:
 * Tier 1: Supabase Edge Function (classify-waste)
 * Tier 2: Direct Google Gemini REST API
 * Tier 3: Diagnostic guidance for missing API key or connectivity
 */
export async function classifyWasteImage(
  imageUri: string,
  preloadedBase64?: string,
): Promise<ClassificationResult> {
  const reqStartTime = new Date().toISOString();

  // 1. Check Image URI (Requirement 1, 11)
  if (!imageUri || typeof imageUri !== "string") {
    if (__DEV__) {
      console.warn(
        "[EcoLift AI] Error: classifyWasteImage called with invalid imageUri:",
        imageUri,
      );
    }
    return getClassificationErrorResult(
      "INVALID_IMAGE",
      "No readable image was provided.",
    );
  }

  const mimeType = getImageMimeType(imageUri);

  // 2. Preprocess Base64 (Requirement 11)
  let base64 = preloadedBase64 || "";
  if (!base64) {
    try {
      base64 = await getImageBase64(imageUri);
    } catch (err: any) {
      if (__DEV__) {
        console.warn(
          "[EcoLift AI] Image preprocessing failed:",
          err?.message || err,
        );
      }
      return getClassificationErrorResult(
        "INVALID_IMAGE",
        "The captured image could not be read.",
      );
    }
  }

  // Sanitize base64 string
  base64 = base64.replace(/\s+/g, "");

  // 3. Attempt Tier 1: Supabase Edge Function ("classify-waste") if online and configured
  let edgeError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const requestPayload = {
        imageBase64: base64,
        mimeType,
        prompt: SYSTEM_PROMPT,
        model,
      };
      const { data: json, error } = await supabase.functions.invoke(
        "classify-waste",
        { body: requestPayload },
      );

      if (!error && json) {
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = parseGeminiJsonResponse(text);
          if (parsed && typeof parsed.category === "string") {
            const finalResult = enrichClassificationResult(
              parsed,
              `Gemini Vision (${model} / Cloud)`,
            );
            if (__DEV__) {
              console.log(
                "[EcoLift AI] Classification succeeded via Supabase Edge Function:",
                finalResult.name,
              );
            }
            return finalResult;
          }
        }
      } else {
        edgeError = error;
      }
    } catch (edgeEx: any) {
      edgeError = edgeEx;
    }
    // Only test first model on edge function to avoid slow repeated round-trips if edge function is un-deployed
    break;
  }

  if (__DEV__ && edgeError) {
    console.info(
      "[EcoLift AI] Edge function unavailable, falling back to direct client Gemini:",
      edgeError?.message || edgeError,
    );
  }

  // 4. Tier 2: Direct Gemini Generative Language REST API Fallback
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    if (__DEV__) {
      console.warn(
        "[EcoLift AI] No Gemini API key found. Prompting user to configure key.",
      );
    }
    return getClassificationErrorResult(
      "MISSING_API_KEY",
      "A Google Gemini API key is required to identify waste. Tap 'Configure API Key' to enter your key or set EXPO_PUBLIC_GEMINI_API_KEY in .env.",
    );
  }

  let lastDirectError: { error?: string; errorCode?: ClassificationErrorCode } | null = null;

  for (const model of GEMINI_MODELS) {
    const directResult = await callGeminiVisionDirect(base64, mimeType, apiKey, model);

    if (directResult.success && directResult.data) {
      const text = directResult.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return getClassificationErrorResult(
          "INVALID_AI_RESPONSE",
          "Gemini returned no classification content.",
        );
      }

      const parsed = parseGeminiJsonResponse(text);
      if (!parsed || typeof parsed.category !== "string") {
        return getClassificationErrorResult(
          "INVALID_AI_RESPONSE",
          "Gemini returned malformed classification JSON.",
        );
      }

      const finalResult = enrichClassificationResult(
        parsed,
        `Gemini Vision (${model})`,
      );

      if (__DEV__) {
        console.log("--- EcoLift AI Classification Debug ---");
        console.log("IMAGE URI:", imageUri);
        console.log("MODEL:", `Gemini Vision (${model})`);
        console.log("IMAGE SIZE:", `${base64.length} base64 chars`);
        console.log("IMAGE MIME TYPE:", mimeType);
        console.log("CLASSIFICATION REQUEST START:", reqStartTime);
        console.log("TOP PREDICTION:", finalResult.name);
        console.log(
          "CONFIDENCE:",
          `${finalResult.confidence}% (${finalResult.confidenceLevel})`,
        );
        console.log(
          "ALTERNATIVE PREDICTIONS:",
          JSON.stringify(finalResult.alternatives),
        );
        console.log("FINAL CLASSIFICATION:", finalResult.category);
        console.log("---------------------------------------");
      }

      return finalResult;
    } else {
      lastDirectError = directResult;
      // If error is invalid API key or rate limit, fail fast instead of hammering other models
      if (
        directResult.errorCode === "INVALID_API_KEY" ||
        directResult.errorCode === "RATE_LIMIT"
      ) {
        return getClassificationErrorResult(
          directResult.errorCode,
          directResult.error || "Gemini API key error.",
        );
      }
    }
  }

  // If all candidate models failed
  const finalCode = lastDirectError?.errorCode || "SERVER_ERROR";
  const finalMessage =
    lastDirectError?.error ||
    "Gemini could not complete the image analysis. Please retry or retake the photo.";

  return getClassificationErrorResult(finalCode, finalMessage);
}

// ============================================================================
// TEST MATRIX EVALUATOR (Requirement 15)
// ============================================================================

export interface TestMatrixItem {
  id: string;
  name: string;
  expectedCategory: WasteCategory;
  expectedMaterialSubstring: string;
  mockRawResult?: any;
}

export const CLASSIFICATION_TEST_MATRIX: TestMatrixItem[] = [
  {
    id: "plastic_water_bottle",
    name: "Plastic Water Bottle",
    expectedCategory: "plastic",
    expectedMaterialSubstring: "PET",
    mockRawResult: {
      name: "Plastic Water Bottle",
      objectType: "bottle",
      material: "Polyethylene Terephthalate (PET #1)",
      category: "plastic",
      subCategory: "pet_1",
      confidence: 95,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 28,
      co2SavingsKg: 0.08,
      ecoPoints: 25,
      tips: ["Empty liquids", "Keep cap screwed on", "Flatten bottle"],
      disposalRecommendation: "Place in curbside plastic recycling bin.",
      alternatives: [
        { label: "Plastic Container", category: "plastic", confidence: 4 },
      ],
    },
  },
  {
    id: "aluminium_can",
    name: "Aluminium Beverage Can",
    expectedCategory: "metal",
    expectedMaterialSubstring: "Aluminium",
    mockRawResult: {
      name: "Aluminium Soda Can",
      objectType: "can",
      material: "Aluminium Alloy 3004",
      category: "metal",
      subCategory: "aluminium",
      confidence: 96,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 15,
      co2SavingsKg: 0.16,
      ecoPoints: 30,
      tips: ["Rinse completely", "Leave pull tab on", "Crush to save space"],
      disposalRecommendation: "Place in yellow curbside metal recycling bin.",
      alternatives: [{ label: "Tin Can", category: "metal", confidence: 3 }],
    },
  },
  {
    id: "steel_can",
    name: "Steel Food Can",
    expectedCategory: "metal",
    expectedMaterialSubstring: "Steel",
    mockRawResult: {
      name: "Steel Soup Can",
      objectType: "food_can",
      material: "Tin-Plated Steel",
      category: "metal",
      subCategory: "steel",
      confidence: 92,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 45,
      co2SavingsKg: 0.12,
      ecoPoints: 25,
      tips: ["Rinse thoroughly", "Push lid inside can", "Recycle with metals"],
      disposalRecommendation: "Place in yellow curbside metal recycling bin.",
      alternatives: [
        { label: "Aluminium Can", category: "metal", confidence: 5 },
      ],
    },
  },
  {
    id: "laptop",
    name: "Laptop Computer",
    expectedCategory: "e_waste",
    expectedMaterialSubstring: "Aluminum",
    mockRawResult: {
      name: "MacBook Pro Laptop",
      objectType: "laptop",
      material: "Aluminum Chassis, Lithium Battery, Circuit Boards",
      category: "e_waste",
      subCategory: "laptop",
      confidence: 94,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 1400,
      co2SavingsKg: 28.5,
      ecoPoints: 50,
      tips: [
        "Do not place in curbside bins",
        "Wipe personal data",
        "Take to certified e-waste depot",
      ],
      disposalRecommendation:
        "Take to an authorized e-waste recycling center or schedule an EcoLift electronics pickup.",
      alternatives: [
        { label: "Tablet", category: "e_waste", confidence: 3 },
        { label: "Desktop PC", category: "e_waste", confidence: 2 },
      ],
    },
  },
  {
    id: "mobile_phone",
    name: "Mobile Phone",
    expectedCategory: "e_waste",
    expectedMaterialSubstring: "Lithium",
    mockRawResult: {
      name: "Smartphone",
      objectType: "mobile_phone",
      material: "Glass, Lithium-Ion Battery, Silicon, Aluminum",
      category: "e_waste",
      subCategory: "mobile_phone",
      confidence: 96,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 180,
      co2SavingsKg: 12.0,
      ecoPoints: 50,
      tips: [
        "Factory reset device",
        "Never dispose in trash",
        "Drop off at certified e-waste bin",
      ],
      disposalRecommendation:
        "Drop off at an e-waste kiosk or certified electronics recycler.",
      alternatives: [{ label: "Tablet", category: "e_waste", confidence: 3 }],
    },
  },
  {
    id: "keyboard",
    name: "Computer Keyboard",
    expectedCategory: "e_waste",
    expectedMaterialSubstring: "Plastic",
    mockRawResult: {
      name: "Mechanical Keyboard",
      objectType: "keyboard",
      material: "ABS Plastic Casing, Circuit Board, Copper Wiring",
      category: "e_waste",
      subCategory: "keyboard",
      confidence: 91,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 600,
      co2SavingsKg: 3.2,
      ecoPoints: 40,
      tips: [
        "Do not put in curbside plastic recycling",
        "Drop off at electronics depot",
        "Coil cord neatly",
      ],
      disposalRecommendation:
        "Take to an e-waste drop-off depot. Electronic peripherals require specialized dismantling.",
      alternatives: [
        { label: "Electronic Accessory", category: "e_waste", confidence: 6 },
      ],
    },
  },
  {
    id: "cardboard_box",
    name: "Cardboard Box",
    expectedCategory: "paper",
    expectedMaterialSubstring: "Kraft",
    mockRawResult: {
      name: "Corrugated Shipping Box",
      objectType: "box",
      material: "Kraft Corrugated Cardboard",
      category: "paper",
      subCategory: "cardboard",
      confidence: 97,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 150,
      co2SavingsKg: 0.25,
      ecoPoints: 30,
      tips: [
        "Flatten box completely",
        "Remove plastic tape and foam",
        "Keep dry",
      ],
      disposalRecommendation: "Flatten and place in blue paper/cardboard bin.",
      alternatives: [{ label: "Paper Bag", category: "paper", confidence: 2 }],
    },
  },
  {
    id: "paper",
    name: "Office Paper / Document",
    expectedCategory: "paper",
    expectedMaterialSubstring: "Paper",
    mockRawResult: {
      name: "Printed Office Paper",
      objectType: "paper",
      material: "Bleached Cellulose Paper",
      category: "paper",
      subCategory: "paper",
      confidence: 93,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 5,
      co2SavingsKg: 0.03,
      ecoPoints: 20,
      tips: ["Remove plastic sleeves", "Keep dry", "Place in blue paper bin"],
      disposalRecommendation: "Place in blue paper recycling bin.",
      alternatives: [{ label: "Newspaper", category: "paper", confidence: 4 }],
    },
  },
  {
    id: "glass_bottle",
    name: "Glass Beverage Bottle",
    expectedCategory: "glass",
    expectedMaterialSubstring: "Glass",
    mockRawResult: {
      name: "Clear Glass Container Bottle",
      objectType: "glass_bottle",
      material: "Soda-Lime Silica Glass",
      category: "glass",
      subCategory: "clear_glass",
      confidence: 95,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 220,
      co2SavingsKg: 0.31,
      ecoPoints: 35,
      tips: [
        "Rinse thoroughly",
        "Remove metal cap",
        "Do not mix with Pyrex or ceramics",
      ],
      disposalRecommendation: "Rinse and place in green glass recycling bin.",
      alternatives: [{ label: "Glass Jar", category: "glass", confidence: 3 }],
    },
  },
  {
    id: "food_waste",
    name: "Food Waste / Banana Peel",
    expectedCategory: "organic",
    expectedMaterialSubstring: "Organic",
    mockRawResult: {
      name: "Banana Peel Food Waste",
      objectType: "fruit_waste",
      material: "Organic Compostable Biomass",
      category: "organic",
      subCategory: "food_waste",
      confidence: 98,
      recyclable: false,
      isWaste: true,
      estimatedWeightGrams: 85,
      co2SavingsKg: 0.05,
      ecoPoints: 20,
      tips: [
        "Great for composting",
        "Decomposes in weeks",
        "Ensure stickers are removed",
      ],
      disposalRecommendation:
        "Place in brown organic compost bin or home compost pile.",
      alternatives: [
        { label: "Plant Waste", category: "organic", confidence: 2 },
      ],
    },
  },
  {
    id: "clothing",
    name: "Cotton T-Shirt / Clothing",
    expectedCategory: "textiles",
    expectedMaterialSubstring: "Cotton",
    mockRawResult: {
      name: "Cotton T-Shirt",
      objectType: "clothing",
      material: "100% Cotton Textile",
      category: "textiles",
      subCategory: "clothing",
      confidence: 94,
      recyclable: true,
      isWaste: true,
      estimatedWeightGrams: 160,
      co2SavingsKg: 1.2,
      ecoPoints: 30,
      tips: [
        "Donate if wearable",
        "Wash and dry before drop-off",
        "Can be recycled into rags",
      ],
      disposalRecommendation:
        "Donate if wearable or drop at a dedicated textile recycling bank.",
      alternatives: [
        { label: "Fabric Scraps", category: "textiles", confidence: 4 },
      ],
    },
  },
  {
    id: "battery",
    name: "AA Alkaline Battery",
    expectedCategory: "hazardous",
    expectedMaterialSubstring: "Zinc",
    mockRawResult: {
      name: "AA Alkaline Battery",
      objectType: "battery",
      material: "Zinc-Manganese Alkaline Cell",
      category: "hazardous",
      subCategory: "battery",
      confidence: 96,
      recyclable: false,
      isWaste: true,
      estimatedWeightGrams: 23,
      co2SavingsKg: 0.04,
      ecoPoints: 15,
      tips: [
        "Never put in household trash or recycling",
        "Tape terminals",
        "Take to battery kiosk",
      ],
      disposalRecommendation:
        "Take to a dedicated battery collection kiosk at a supermarket or hazardous waste center.",
      alternatives: [
        { label: "Lithium Battery", category: "hazardous", confidence: 3 },
      ],
    },
  },
];

export function runTestMatrixEvaluation(): {
  id: string;
  image: string;
  expectedCategory: WasteCategory;
  actualCategory: WasteCategory;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  pass: boolean;
}[] {
  return CLASSIFICATION_TEST_MATRIX.map((testItem) => {
    const enriched = enrichClassificationResult(
      testItem.mockRawResult,
      "Gemini Vision AI (Test Runner)",
    );
    const pass =
      enriched.category === testItem.expectedCategory &&
      enriched.confidence >= CONFIDENCE_THRESHOLDS.HIGH &&
      enriched.confidenceLevel === "high" &&
      enriched.name.toLowerCase() !== "clear pet plastic beverage bottle";

    return {
      id: testItem.id,
      image: testItem.name,
      expectedCategory: testItem.expectedCategory,
      actualCategory: enriched.category,
      confidence: enriched.confidence,
      confidenceLevel: enriched.confidenceLevel,
      pass,
    };
  });
}
