# How the AI Recommends Recipes

This document explains the logic behind the "Chef Assistant" and how it uses your personal data—preferences, allergens, past ratings, and history—to tailor recipe suggestions.

*Code Reference:* The core logic resides in `supabase/functions/ai-chat/index.ts`. All data is aggregated into a final `systemPrompt` (around line 747) that governs the AI's behavior.

## 1. Safety First: Allergens & Restrictions

Your dietary restrictions are treated as the highest priority **"Critical Safety Requirement"**.

- **How it works:** When you define `food_restrictions` in your profile (e.g., "Shellfish", "Gluten", "Peanuts"), the system builds a strict "Block List" for the AI.
- **Code Reference:**
  - Logic found in `supabase/functions/ai-chat/index.ts` within the `preferencesContext` block (approx. lines 539-608).
  - Specifically, the system injects the header `🚨 **CRITICAL SAFETY REQUIREMENT...**` (line 573) and detailed "NO [Allergen]" rules for specific categories like Shellfish, Gluten, Dairy, etc.
- **The Instruction:** The AI is explicitly instructed: *"YOU MUST NEVER suggest any recipe containing these allergens. This is non-negotiable."*
- **Verification:** Before suggesting *any* recipe, the AI is prompted to:
    1. Check ingredients against your allergen list.
    2. Check for hidden sources or cross-contamination risks.
    3. Proactively suggest safe substitutions if a common ingredient is restricted.

## 2. User Preferences

Your general cooking profile helps the AI understand your "vibe" and constraints.

- **Data Used:**
  - **Dietary Style:** (e.g., Keto, Vegetarian)
  - **Time Preference:** (Quick <30m, Moderate 30-60m, Relaxed 60m+)
  - **Skill Level:** Adjusts the complexity of recipes.
  - **Household Size:** Adjusts portion sizes.
  - **Equipment:** (e.g., "Air Fryer", "Instant Pot") - The AI will prioritize recipes using what you have.
  - **Flavor/Spice:** (e.g., "Spicy", "Savory")
- **Code Reference:**
  - Logic found in `supabase/functions/ai-chat/index.ts` where `preferencesContext` is built (approx. lines 524-570).
  - This strings together `UserPreferences` fields into a narrative block starting with `**User Cooking Preferences:**`.

## 3. Learning from Your Feedback (Ratings)

The system has a memory of what you liked and disliked to improve future guesses.

- **Data Used:** The last **20 rated recipes** are retrieved.
- **Liked Recipes:** The AI sees a list of what you gave a "Thumbs Up". It uses this to find similar flavor profiles, ingredients, or cuisines you enjoy.
- **Disliked Recipes:** The AI sees a list of what you gave a "Thumbs Down" (and any feedback text you provided). It is instructed to *avoid* suggesting similar recipes or repeating the specific mistakes (e.g., "too complicated", "bland") mentioned in your feedback.
- **Code Reference:**
  - Logic found in `supabase/functions/ai-chat/index.ts` within the `ratingContext` block (approx. lines 612-642).
  - It filters `ratingHistory` into `likedRecipes` and `dislikedRecipes`.
  - It injects lists labeled `Recipes they LIKED:` and `Recipes they DISLIKED:` directly into the prompt.

## 4. Forcing Variety (The "Cool-Down" System)

To prevent the AI from getting stuck in a loop (e.g., always suggesting "Sheet Pan Chicken"), there is a **14-day Cool-Down** mechanism.

- **How it works:** The system tracks every recipe the AI has suggested to you in the last **2 weeks**.
- **Code Reference:**
  - **Fetching Data:** Function `getRecentlySuggestedRecipes` (lines 170-197) queries the `suggested_recipes` table for items from the last 14 days.
  - **Prompt Injection:** The `recentRecipesContext` variable (lines 722-745) formats this list under `---------- RECENTLY SUGGESTED ----------`.
- **The Instruction:** This list is fed to the AI with a **"FORCE VARIETY"** command.
- **The Rules:**
  - **Do NOT** suggest recipes on this list.
  - **Do NOT** suggest conceptually similar variations (e.g., if you saw "Aglio e Olio", it shouldn't show "Garlic Butter Pasta" immediately).
  - **Deprioritize Defaults:** The AI is told to dig deeper into its knowledge base rather than relying on its "top 10" most common answers.

## 5. Session Context

Finally, the AI looks at the current conversation.

- **Active Chat:** If you say "I have chicken and broccoli", that immediate constraint overrides general preferences (except allergens).
- **Weekly Planning:** If you ask for a plan, the AI enters "Planner Mode," where it gathers specific constraints for *this* week before making suggestions, ensuring the plan fits your immediate schedule.
- **Code Reference:**
  - **Planner Mode:** Detected via the `weeklyBrief` flag. This triggers `weeklyBriefContext` (lines 644-655), which strictly instructs the AI to *return an empty suggestions array* and ask clarifying questions first.
  - **Cuisine Detection:** `detectCuisineFromMessages` (lines 224-329) analyzes the chat conversation to identify if a specific cuisine is being discussed, potentially guiding the recommendations.

---

# Future Improvements: Phased Recommendations Plan

To enhance the intelligence of the "Cool-Down" system and general variety, we propose the following phased implementation plan.

## Phase 1: Structured Feature Tracking (The "Smart Tag" Upgrade)

**Goal:** Move from "Name-Based" exclusion to "Feature-Based" variety control.

1. **Database Update:** Add `protein`, `carb`, and `method` columns to the `suggested_recipes` table.
2. **AI Output Schema:** Update the JSON structure to require the AI to tag its own suggestions (e.g., `{"title": "Chicken Parm", "tags": {"protein": "chicken", "carb": "pasta"}}`).
3. **Logic Update:** Enforce explicit limits (e.g., "Max 2 Chicken dishes in last 5 suggestions").

## Phase 2: User Action Differentiation

**Goal:** Treat "Cooked" differently from "Ignored".

1. **Frontend Tracking:** Explicitly track "Click Through" (user expanded details) vs. "Viewed Only" (suggestion shown but ignored).
2. **Cooldown Tiers:**
    - **Cooked:** 30-day cooldown (High saturation).
    - **Ignored:** 5-day cooldown (User wasn't interested *now*, but maybe later).
    - **Thumbs Down:** Permanent ban on that specific recipe vector.

## Phase 3: Vector Similarity & Meal Archetypes

**Goal:** "Gold Standard" variety using semantic understanding.

1. **Embeddings:** Generate and store a vector embedding for every suggestion string.
2. **Similarity Check:** Before returning options, run a cosine similarity check against the last 10 suggestions. If similarity > 85%, discard and regenerate.
3. **Archetype Buckets:** Define core meal types (Soup, Salad, Roast, Handheld) and prompt the AI to ensure suggestions fill at least 3 distinct buckets for maximum spread.
