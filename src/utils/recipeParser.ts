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
    prepTime: number;
    cookTime: number;
}

export const parseIngredient = (line: string): ParsedIngredient => {
    const cleaned = line.replace(/^\s*[-*•]\s/, '').trim();
    const parts = cleaned.match(/^([\d./]+)?\s*([a-z]+)?\s*(.+)$/i);
    if (parts) {
        return {
            quantity: parts[1]?.trim() || '1',
            unit: parts[2]?.trim() || '',
            name: parts[3]?.trim() || cleaned,
        };
    } else {
        return { quantity: '', unit: '', name: cleaned };
    }
};

export const parseAIRecipe = (text: string): ParsedRecipe => {
    console.log('=== PARSING RECIPE ===');
    console.log('Raw text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));

    const lines = text.split('\n').filter((line) => line.trim());
    console.log('Total lines:', lines.length);

    let title = 'AI Suggested Recipe';
    let description = '';
    const ingredients: ParsedIngredient[] = [];
    const instructions: string[] = [];
    let section: 'none' | 'ingredients' | 'instructions' = 'none';
    let prepTime = 0;
    let cookTime = 0;
    let titleFound = false;
    const descriptionLines: string[] = [];

    lines.forEach((line, index) => {
        const lowerLine = line.toLowerCase();

        // Parse prep time - handle formats like "**Prep Time:** 10 minutes", "Prep Time: approx 10 mins", etc.
        const prepMatch = line.match(/(?:prep|preparation)\s+time.*?(\d+)/i);
        if (prepMatch) {
            prepTime = parseInt(prepMatch[1]);
            return;
        }

        // Parse cook time - handle formats like "**Cook Time:** 30 minutes", "Cook Time: ~30 mins"
        const cookMatch = line.match(/(?:cook|cooking)\s+time.*?(\d+)/i);
        if (cookMatch) {
            cookTime = parseInt(cookMatch[1]);
            return;
        }

        // Look for the first markdown heading as the recipe title
        if (!titleFound && line.match(/^#{1,3}\s+/)) {
            title = line.replace(/^#+\s+/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
            titleFound = true;
            return;
        }

        if (lowerLine.includes('ingredient')) {
            section = 'ingredients';
            console.log('Switched to ingredients section at line', index);
            // Convert accumulated description lines to description
            if (descriptionLines.length > 0) {
                description = descriptionLines.join(' ').trim();
            }
        } else if (lowerLine.includes('instruction') || lowerLine.includes('direction') || lowerLine.includes('step')) {
            section = 'instructions';
            console.log('Switched to instructions section at line', index);
        } else if (section === 'ingredients' && line.match(/^\s*[-*•]\s/)) {
            ingredients.push(parseIngredient(line));
        } else if (section === 'instructions' && line.match(/^(\d+\.|-|\*|•)/)) {
            const instruction = line.replace(/^(\d+\.|-|\*|•)\s*/, '').trim();
            console.log('Found instruction:', instruction.substring(0, 50));
            instructions.push(instruction);
        } else if (section === 'instructions' && line.trim().length > 0 && !line.match(/^#{1,3}\s+/)) {
            // Capture any non-empty line in instructions section that isn't a heading
            // This handles cases where numbered steps might be formatted differently
            console.log('Adding line as instruction (fallback):', line.substring(0, 50));
            instructions.push(line.trim());
        } else if (section === 'none' && titleFound && !lowerLine.includes('prep time') && !lowerLine.includes('cook time') && !lowerLine.includes('servings')) {
            // Collect lines after the title but before ingredients as description
            descriptionLines.push(line.trim());
        }
    });

    console.log('Parsed instructions count:', instructions.length);

    return {
        title,
        description,
        ingredients,
        instructions,
        prepTime,
        cookTime
    };
};
