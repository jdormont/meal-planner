# AI Recipe & Meal Planner

## Welcome!

Welcome to the AI Recipe & Meal Planner! This is a smart assistant designed to help you organize your culinary life. Whether you're a seasoned chef or just starting out, this app helps you find recipes, plan your weekly meals, and get cooking advice from an AI kitchen companion.

Think of it as your digital Sous-Chef that never gets tired and knows exactly what you like to eat.

---

## What This App Does 

Here is a simple breakdown of the main features:

### 1. Smart Recipe Manager
*   **Your Personal Cookbook:** Save all your favorite recipes in one place.
*   **Easy Organization:** The app automatically tags your recipes (e.g., "Italian", "Vegetarian", "Quick Dinner") so you can find them instantly.
*   **Shared & Private:** Keep your secret family recipes private, or share your best creations with the community.
*   **Auto-Images:** Don't have a photo? The app automatically finds beautiful pictures for your dishes.

### 2. AI Chef Assistant
*   **Chat with a Pro:** Stuck on what to make? Just ask! "I have chicken and broccoli, what can I cook?"
*   **Dietary Safety:** The AI knows your allergies (like nuts or gluten) and will warn you if a recipe isn't safe, or suggest substitutes.
*   **Cooking Advice:** Ask for tips like "How long do I boil an egg?" or "Can I use honey instead of sugar?"

### 3. Weekly Meal Planner
*   **Plan Ahead:** Drag and drop recipes into a weekly calendar.
*   **Stay Organized:** Know exactly what you are cooking for Monday dinner or Sunday brunch.
*   **Track History:** Look back at what you ate last month to bring back old favorites.

---

## How the Database is Structured

You don't need to value code to understand how your data is stored. Here is a conceptual overview:

### 👤 Your Profile
This is the heart of the app. It stores:
*   **Preferences:** Do you love spicy food? Hate cilantro?
*   **Dietary Style:** Vegetarian, Keto, Paleo, etc.
*   **Allergies:** Critical information to keep you safe.
*   **Skill Level:** Helps the AI suggest recipes that match your cooking ability.

### 📖 Recipes
Think of this as a big library of index cards.
*   **Private Recipes:** Cards only you can see.
*   **Shared Recipes:** Cards everyone can see.
*   Each card holds the ingredients, instructions, prep time, and photos.

### 📅 Meals
This connects **Recipes** to **Dates**.
*   It's simply a link saying "On [Date], we are cooking [Recipe Name]".
*   This allows you to plan the same recipe multiple times without copying it.

### 💬 Chat History
*   The app remembers your conversations with the AI so you can scroll back and find that tip it gave you last week.

---

## How to Run It

Follow these simple steps to get the app running on your computer.

### Prerequisites (What you need first)
*   **Node.js**: This is the engine that runs the app. Download and install it from [nodejs.org](https://nodejs.org/).

### Installation

1.  **Download the Code**
    Open your terminal (command prompt) and run:
    ```bash
    git clone <repository-url>
    cd meal-planner
    ```

2.  **Install the "Parts"**
    This command downloads all the necessary tools for the app to work:
    ```bash
    npm install
    ```

3.  **Setup the Database**
    You will need a file called `.env` with your secure keys (ask your administrator for these if you don't have them).
    It looks like this:
    ```env
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    ```

4.  **Start the App!**
    Run this command to turn it on:
    ```bash
    npm run dev
    ```

    You should see a message saying the app is running at `http://localhost:5173`. Open that link in your web browser!

---

## Need Help?

If you run into trouble, check the `TECHNICAL_DOCS.md` file for more advanced details, or reach out to the development team.

Happy Cooking! 🍳
