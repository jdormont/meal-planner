export interface ParsedIngredient {
    name: string;
    quantity: string;
    unit: string;
}

export interface ParsedRecipe {
    title: string;
    description: string;
    ingredients: ParsedIngredient[];
    instructions: string[];
    totalTime: number;
}

// Map Unicode fraction glyphs to ASCII equivalents before parsing
const UNICODE_FRACTIONS: Record<string, string> = {
    '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
    '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
    '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8'
};

// Words that are valid measurement units — anything else that appears where a
// unit would be expected is treated as part of the ingredient name instead.
const KNOWN_UNITS = new Set([
    'tsp', 'teaspoon', 'teaspoons',
    'tbsp', 'tablespoon', 'tablespoons',
    'cup', 'cups',
    'fl', // fl oz
    'oz', 'ounce', 'ounces',
    'lb', 'lbs', 'pound', 'pounds',
    'g', 'gram', 'grams',
    'kg', 'kilogram', 'kilograms',
    'ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres',
    'l', 'liter', 'liters', 'litre', 'litres',
    'pt', 'pint', 'pints',
    'qt', 'quart', 'quarts',
    'gal', 'gallon', 'gallons',
    'pinch', 'dash', 'drop', 'handful', 'bunch',
    'slice', 'slices', 'piece', 'pieces',
    'clove', 'cloves', 'head', 'heads',
    'can', 'cans', 'package', 'packages', 'pkg',
    'bag', 'bags', 'bottle', 'bottles', 'jar', 'jars', 'box', 'boxes',
    'sprig', 'sprigs', 'stalk', 'stalks', 'stick', 'sticks',
    'sheet', 'sheets', 'strip', 'strips',
]);

// Phrases that indicate a qualitative (non-numeric) amount
const TO_TASTE_PHRASES = ['to taste', 'as needed', 'as desired', 'to garnish', 'for garnish', 'for serving'];

function normalizeUnicodeFractions(text: string): string {
    let result = text;
    for (const [glyph, ascii] of Object.entries(UNICODE_FRACTIONS)) {
        result = result.replaceAll(glyph, ascii);
    }
    return result;
}

export const parseIngredient = (line: string): ParsedIngredient => {
    let cleaned = normalizeUnicodeFractions(line.replace(/^\s*[-*•]\s/, '').trim());

    // Handle qualitative quantities like "salt, to taste"
    for (const phrase of TO_TASTE_PHRASES) {
        if (cleaned.toLowerCase().includes(phrase)) {
            const name = cleaned
                .replace(new RegExp(`,?\\s*${phrase}`, 'gi'), '')
                .trim();
            return { quantity: phrase, unit: '', name: name || cleaned };
        }
    }

    // Try to extract: optional-quantity  optional-unit  name
    // Quantity may be a whole number, fraction, or mixed number (e.g. "1 1/2")
    const parts = cleaned.match(/^([\d./]+(?:\s+[\d./]+)?)?\s*([a-zA-Z]+)?\s+(.+)$/);
    if (parts) {
        const rawQty  = parts[1]?.trim() ?? '';
        const rawUnit = parts[2]?.trim() ?? '';
        const rest    = parts[3]?.trim() ?? '';

        if (rawUnit && !KNOWN_UNITS.has(rawUnit.toLowerCase())) {
            // The word looked like a unit but isn't one — fold it back into the name
            return {
                quantity: rawQty || '1',
                unit: '',
                name: `${rawUnit} ${rest}`.trim(),
            };
        }

        return {
            quantity: rawQty || '1',
            unit: rawUnit,
            name: rest || cleaned,
        };
    }

    // Fallback: treat the entire string as the name
    return { quantity: '', unit: '', name: cleaned };
};

export const parseAIRecipe = (text: string): ParsedRecipe => {
    const lines = text.split('\n').filter((line) => line.trim());

    let title = 'AI Suggested Recipe';
    let description = '';
    const ingredients: ParsedIngredient[] = [];
    const instructions: string[] = [];
    let section: 'none' | 'ingredients' | 'instructions' = 'none';
    let prepTime = 0;
    let cookTime = 0;
    let totalTime = 0;
    let titleFound = false;
    const descriptionLines: string[] = [];

    lines.forEach((line) => {
        const lowerLine = line.toLowerCase();

        // Parse explicit time lines
        const totalMatch = line.match(/\*?\*?total\s+time:?\*?\*?\s*(\d+)/i);
        if (totalMatch) { totalTime = parseInt(totalMatch[1]); return; }

        const prepMatch = line.match(/\*?\*?prep\s+time:?\*?\*?\s*(\d+)/i);
        if (prepMatch) { prepTime = parseInt(prepMatch[1]); return; }

        const cookMatch = line.match(/\*?\*?cook\s+time:?\*?\*?\s*(\d+)/i);
        if (cookMatch) { cookTime = parseInt(cookMatch[1]); return; }

        // First markdown heading becomes the recipe title
        if (!titleFound && line.match(/^#{1,3}\s+/)) {
            title = line.replace(/^#+\s+/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
            titleFound = true;
            return;
        }

        if (lowerLine.includes('ingredient')) {
            section = 'ingredients';
            if (descriptionLines.length > 0) {
                description = descriptionLines.join(' ').trim();
            }
        } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
            section = 'instructions';
        } else if (section === 'ingredients' && line.match(/^\s*[-*•]\s/)) {
            ingredients.push(parseIngredient(line));
        } else if (section === 'instructions' && line.match(/^(\d+\.|-|\*|•)/)) {
            instructions.push(line.replace(/^(\d+\.|-|\*|•)\s*/, '').trim());
        } else if (section === 'instructions' && line.trim().length > 0 && !line.match(/^#{1,3}\s+/)) {
            instructions.push(line.trim());
        } else if (section === 'none' && titleFound && !lowerLine.includes('prep time') && !lowerLine.includes('cook time') && !lowerLine.includes('servings')) {
            descriptionLines.push(line.trim());
        }
    });

    return {
        title,
        description,
        ingredients,
        instructions,
        totalTime: totalTime > 0 ? totalTime : (prepTime + cookTime)
    };
};
