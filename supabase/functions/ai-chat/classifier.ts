import { Message, UserPreferences } from "../_shared/types.ts";

export interface CuisineClassification {
  primary: string | null;
  secondary: string[];
  mode: "authentic" | "inspired" | "none";
  confidence: "high" | "medium" | "low";
}

const CULINARY_KEYWORDS = [
  "recipe", "cook", "food", "dish", "meal", "dinner", "lunch", "breakfast", "brunch", "snack", "dessert",
  "ingredient", "prep", "bake", "fry", "roast", "saute", "boil", "grill", "steam", "sear", "simmer", "braise",
  "scale", "portion", "serving", "servings", "cocktail", "drink", "mix", "pantry", "kitchen", "menu", "plan",
  "eat", "eating", "taste", "flavor", "spice", "spicy", "hot", "sweet", "sour", "salty", "bitter", "umami",
  "sauce", "soup", "stew", "salad", "meat", "chicken", "beef", "pork", "fish", "shrimp", "seafood", "tofu",
  "vegetable", "veg", "rice", "pasta", "noodle", "potato", "bread", "cheese", "egg", "eggs", "oil", "salt",
  "pepper", "onion", "garlic", "herb", "herbs", "curry", "taco", "sushi", "pizza", "burger", "steak", "fry",
  "fusion", "authentic", "inspired", "style", "cuisine", "taste", "tasty", "yummy", "hungry"
];

export function hasFoodOrCookingContent(text: string): boolean {
  const clean = text.toLowerCase().trim();
  if (!clean) return false;

  // 1. System/settings commands always return false immediately.
  const systemPatterns = [
    /^(clear|reset|delete|undo|cancel|stop)(\s+.*)?$/i,
    /^(change|update|set|edit|my|configure)\s+(?:my\s+|the\s+)?(settings|preferences|profile|diet|allergies|model|email|password|account)(\s+.*)?$/i
  ];
  if (systemPatterns.some(pattern => pattern.test(clean))) {
    return false;
  }

  // 2. Simple greetings/thanks: check if they also contain culinary keywords (e.g. "hi, give me a Thai recipe")
  const greetingPatterns = [
    /^(hi|hello|hey|yo|greetings|good morning|good afternoon|good evening|howdy)(\s+.*)?$/i,
    /^(how are you|how\'s it going|what\'s up|whats up|how is it going|how are you doing)(\s+.*)?$/i,
    /^(who are you|what can you do|what are you|what is this|help|info|information)(\s+.*)?$/i,
    /^(thank you|thanks|thank you very much|thanks a lot|appreciate it)(\s+.*)?$/i,
    /^(bye|goodbye|see you|see ya|talk to you later)(\s+.*)?$/i
  ];

  const isGreeting = greetingPatterns.some(pattern => pattern.test(clean));
  if (isGreeting) {
    return CULINARY_KEYWORDS.some(kw => {
      const regex = new RegExp(`\\b${kw}(?:es|s)?\\b`, "i");
      return regex.test(clean);
    });
  }

  // 3. For short messages, require at least one culinary keyword with word boundaries & plural support
  if (clean.length < 15) {
    return CULINARY_KEYWORDS.some(kw => {
      const regex = new RegExp(`\\b${kw}(?:es|s)?\\b`, "i");
      return regex.test(clean);
    });
  }

  return true;
}

export async function classifyCuisine(
  messages: Message[],
  userPreferences: UserPreferences,
  provider: string,
  apiKey: string,
  callLLM: (provider: string, apiKey: string, model: string, messages: Message[], systemPrompt: string) => Promise<string>
): Promise<CuisineClassification> {
  const defaultResult: CuisineClassification = {
    primary: null,
    secondary: [],
    mode: "none",
    confidence: "low",
  };

  try {
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMessages = userMessages.slice(-5);

    if (lastUserMessages.length === 0) {
      return defaultResult;
    }

    const lastMessageContent = lastUserMessages[lastUserMessages.length - 1].content;
    if (!hasFoodOrCookingContent(lastMessageContent)) {
      console.log("Classifier skipped: User message contains no food/cooking content.");
      return defaultResult;
    }

    const favoriteCuisines = userPreferences?.favorite_cuisines || [];
    const conversationText = lastUserMessages.map((m) => `User: ${m.content}`).join("\n");
    const userPrompt = `Conversation History (last 5 user messages):\n${conversationText}\n\nFavorite Cuisines: ${favoriteCuisines.join(", ")}`;

    const systemPrompt = `You are a culinary assistant. Analyze the user's cooking/recipe request messages and preferences to determine the cuisine characteristics.

Provide JSON output only. Do not output any thinking or wrapping text.

Context:
Favorite Cuisines: ${favoriteCuisines.join(", ")}

Analyze the conversation (especially the last messages) for:
1. Culinary intent (e.g. asking for a recipe, dish suggestion, substitution, or scaling).
2. Primary cuisine: The main cuisine name they are interested in (e.g. "Thai", "Mexican", "Italian", "Japanese"). Return null if no clear cuisine interest is expressed.
3. Secondary cuisines: Any other cuisines mentioned that represent a fusion, influence, or comparison (e.g. for "Japanese-Mexican fusion tacos", primary is "Mexican", secondary is ["Japanese"]). Return an empty array if none.
4. Mode:
   - "authentic": User explicitly wants an authentic/traditional recipe (e.g. "authentic pad kra pao", "traditional carbonara", "how they make it in Mexico").
   - "inspired": User wants inspired/fused recipes or has significant deviations/substitutions (e.g. "Thai-inspired salmon", "teriyaki tacos", "pasta but with what I have").
   - "none": No specific cuisine style, or primary is null.
5. Confidence:
   - "high": Clear mention of cuisine or highly specific dishes belonging to that cuisine.
   - "medium": Indirect mention, minor keywords, or matching user's favorite cuisines when they ask for general ideas but specify a preference.
   - "low": No clear cuisine hints, or generic inquiries.

OUTPUT SCHEMA (JSON ONLY):
{
  "primary": string | null,
  "secondary": string[],
  "mode": "authentic" | "inspired" | "none",
  "confidence": "high" | "medium" | "low"
}

Remember: Be decisive. If the request is generic ("what should I cook for dinner"), primary is null, mode is "none", confidence is "low".`;

    let classifierModel = "";
    if (provider === "openai") {
      classifierModel = "gpt-4o-mini";
    } else if (provider === "anthropic") {
      classifierModel = "claude-haiku-4-5-20251001";
    } else if (provider === "google") {
      classifierModel = "gemini-1.5-flash";
    } else {
      console.error(`Unsupported provider for classifier: ${provider}`);
      return defaultResult;
    }

    console.log(`Calling cuisine classifier with provider: ${provider}, model: ${classifierModel}`);
    const classifierMessages = [{ role: "user" as const, content: userPrompt }];

    const responseText = await callLLM(provider, apiKey, classifierModel, classifierMessages, systemPrompt);

    const cleanJson = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/\s*```$/, "")
      .trim();

    const result = JSON.parse(cleanJson);
    console.log("Cuisine classifier response parsed:", result);

    const primary = typeof result.primary === "string" && result.primary.trim() ? result.primary.trim() : null;
    const secondary = Array.isArray(result.secondary)
      ? result.secondary.filter((s: any) => typeof s === "string" && s.trim()).map((s: string) => s.trim())
      : [];
    const mode = ["authentic", "inspired", "none"].includes(result.mode) ? result.mode : "none";
    const confidence = ["high", "medium", "low"].includes(result.confidence) ? result.confidence : "low";

    // If primary is null or confidence is low, return mode: "none" and skip profile injection entirely
    if (!primary || confidence === "low") {
      return {
        primary: null,
        secondary: [],
        mode: "none",
        confidence: "low",
      };
    }

    return { primary, secondary, mode, confidence };
  } catch (error) {
    console.error("Error running cuisine classifier:", error);
    return defaultResult;
  }
}
