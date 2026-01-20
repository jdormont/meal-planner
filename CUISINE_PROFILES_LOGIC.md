# How Cuisine Profiles Work

When the "Chef Assistant" detects you are interested in a specific cuisine (e.g., "Mexican", "Italian", "Thai"), it activates a specialized **Cuisine Mode**. This overrides generic cooking knowledge with deep, culture-specific rules to ensure authenticity.

## 1. How It Gets Activated by Keyword Matching

The system constantly scans your conversation for cuisine-related keywords.

* **Scoring:** It counts keywords in your latest messages. (e.g., "taco", "salsa", "Mexican" all add points).
* **Threshold:** If the score is high enough (>= 5 for High Confidence, >= 2 for Medium), **Cuisine Mode** triggers automatically.
* **Fallback:** If no keywords are found, it checks your `favorite_cuisines` profile setting.

## 2. What Changes in "Cuisine Mode"?

Once activated, a detailed "Cuisine Profile" is injected into the AI's brain. This is not just a label; it is a strict set of data-driven guidelines.

### A. Style Focus & Philosophy

Sets the "vibe" and cooking mentality.

* *Example (Italian):* Focus on "Ingredient Outsourcing" (letting high-quality ingredients shine) rather than heavy spice blends.
* *Example (Thai):* Focus on the balance of the 4 flavors: Sweet, Sour, Salty, Spicy.

### B. Ingredient Boundaries

Defines what belongs and what is forbidden.

* **Common Ingredients:** The AI is encouraged to use these. (e.g., Fish Sauce, Lime, Chili for Thai).
* **AVOID List:** The AI is strictly told to avoid ingredients that "don't belong" unless absolutely necessary. (e.g., No Cheddar cheese in authentic Mexican tacos; use Cotija or Oaxaca instead).

### C. Technique Defaults

Adjusts the cooking methods suggested.

* *Example:* For detailed stir-fries, it might enforce "High Heat, Quick Toss" instructions.
* *Example:* For French stews, it might emphasize "Low and Slow" braising.

### D. Generation Guardrails

Specific "Do's and Don'ts" to prevent common "Americanized" mistakes.

* **Do Suggest:** Official, named dishes (e.g., "Pad Kra Pao").
* **Don't Suggest:** Generic mashups (e.g., "Thai Basil Spaghetti" - unless specifically asked for fusion).

## 3. The Result

This system ensures that when you ask for "tacos", you get a recipe that feels like it came from a specific culinary tradition, rather than a generic "meat and cheese in a shell" suggestion. It respects the *spirit* of the cuisine while still adapting to your skill level and time constraints.
