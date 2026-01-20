# How the AI Recommends Recipes

This document explains the logic behind the "Chef Assistant" and how it uses your personal data—preferences, allergens, past ratings, and history—to tailor recipe suggestions.

## 1. Safety First: Allergens & Restrictions

Your dietary restrictions are treated as the highest priority **"Critical Safety Requirement"**.

- **How it works:** When you define `food_restrictions` in your profile (e.g., "Shellfish", "Gluten", "Peanuts"), the system builds a strict "Block List" for the AI.
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

## 3. Learning from Your Feedback (Ratings)

The system has a memory of what you liked and disliked to improve future guesses.

- **Data Used:** The last **20 rated recipes** are retrieved.
- **Liked Recipes:** The AI sees a list of what you gave a "Thumbs Up". It uses this to find similar flavor profiles, ingredients, or cuisines you enjoy.
- **Disliked Recipes:** The AI sees a list of what you gave a "Thumbs Down" (and any feedback text you provided). It is instructed to *avoid* suggesting similar recipes or repeating the specific mistakes (e.g., "too complicated", "bland") mentioned in your feedback.

## 4. Forcing Variety (The "Cool-Down" System)

To prevent the AI from getting stuck in a loop (e.g., always suggesting "Sheet Pan Chicken"), there is a **14-day Cool-Down** mechanism.

- **How it works:** The system tracks every recipe the AI has suggested to you in the last **2 weeks**.
- **The Instruction:** This list is fed to the AI with a **"FORCE VARIETY"** command.
- **The Rules:**
  - **Do NOT** suggest recipes on this list.
  - **Do NOT** suggest conceptually similar variations (e.g., if you saw "Aglio e Olio", it shouldn't show "Garlic Butter Pasta" immediately).
  - **Deprioritize Defaults:** The AI is told to dig deeper into its knowledge base rather than relying on its "top 10" most common answers.

## 5. Session Context

Finally, the AI looks at the current conversation.

- **Active Chat:** If you say "I have chicken and broccoli", that immediate constraint overrides general preferences (except allergens).
- **Weekly Planning:** If you ask for a plan, the AI enters "Planner Mode," where it gathers specific constraints for *this* week before making suggestions, ensuring the plan fits your immediate schedule.
