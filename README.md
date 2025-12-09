# AI Recipe & Meal Planner

A comprehensive recipe management and meal planning application with AI-powered assistance for discovering recipes, planning weekly meals, and organizing your culinary life.

## Features

### Recipe Management
- **Create & Organize Recipes** - Store recipes with ingredients, instructions, prep/cook times, and servings
- **Smart Search & Filter** - Find recipes by name, ingredients, tags, or dietary restrictions
- **Recipe Ratings** - Rate recipes with thumbs up/down and optional feedback
- **Auto-Generated Images** - Beautiful stock photos automatically sourced for recipes
- **AI Auto-Tagging** - Automatic recipe categorization and tag suggestions
- **Public/Private Sharing** - Share recipes with the community or keep them private
- **Recipe Import** - Import recipes from popular cooking websites with one click
- **Cocktail Support** - Dedicated support for beverage and cocktail recipes

### AI Assistant
- **Natural Language Chat** - Ask for recipe ideas, substitutions, and cooking advice
- **Personalized Suggestions** - Context-aware recommendations based on your preferences
- **Allergy Safety** - Comprehensive handling of dietary restrictions with safe substitutions
- **Recipe Generation** - AI creates complete recipes that are automatically saved
- **Learning System** - Improves suggestions based on your ratings and cooking history
- **Multi-Chat Support** - Maintain multiple conversation threads

### Meal Planning
- **Weekly Meal Planning** - Plan meals with dates, notes, and multiple recipes
- **Recipe Association** - Link multiple recipes to each meal
- **Completion Tracking** - Track which recipes you've completed for each meal
- **Meal History** - Archive and review past meals
- **Flexible Organization** - Edit, delete, and reorganize meals as needed

### User Experience
- **User Preferences** - Set dietary style, cuisines, allergies, skill level, and more
- **Account Management** - Secure authentication with admin approval workflow
- **Community Recipes** - Browse and adopt recipes shared by other users
- **Settings** - Comprehensive customization options for personalization
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### Admin Features
- **User Management** - Approve or reject new user registrations
- **Admin Dashboard** - View all users, statuses, and manage accounts
- **Login Tracking** - Monitor user activity and login counts
- **Access Control** - Row-level security ensures data privacy

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vite** for build tooling

### Backend & Database
- **Supabase** for:
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Real-time sync
  - Edge Functions

### AI Integration
- **OpenAI** (GPT-4o-mini) or **Anthropic** (Claude 3.5 Sonnet)
- Context-aware prompts with user preferences
- Recipe rating history integration
- Comprehensive allergy safety guidelines
- Structured recipe parsing and saving

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works great)
- An OpenAI or Anthropic API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these values in your Supabase project settings.

4. **Run database migrations**

   All migrations are located in `supabase/migrations/`. Apply them in order through the Supabase dashboard or using the Supabase CLI.

5. **Deploy Edge Functions** (Optional, for AI features)

   The following edge functions need to be deployed:
   - `ai-chat` - Main AI assistant
   - `auto-tag-recipe` - Automatic recipe categorization
   - `get-recipe-image` - Stock photo integration
   - `import-recipe` - Recipe URL import
   - `admin-get-users` - User management
   - `admin-update-user-status` - User approval
   - `admin-delete-user` - User deletion

   You'll need to set up your AI API key as an environment variable in Supabase Edge Functions:
   ```
   OPENAI_API_KEY=your_openai_key
   # OR
   ANTHROPIC_API_KEY=your_anthropic_key
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

### First-Time Setup

1. **Create your account** - The first user to sign up automatically becomes an admin
2. **Set up preferences** - Fill out your dietary preferences, cuisines, and restrictions
3. **Start adding recipes** - Create your first recipe or import one from a URL
4. **Try the AI assistant** - Ask for recipe ideas based on your preferences

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── AccountStatus.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AIChat.tsx
│   │   ├── Auth.tsx
│   │   ├── CommunityRecipes.tsx
│   │   ├── MealDetail.tsx
│   │   ├── MealForm.tsx
│   │   ├── MealList.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── RecipeImportModal.tsx
│   │   ├── RecipeList.tsx
│   │   ├── RecipePhotoModal.tsx
│   │   ├── RecipeSearch.tsx
│   │   └── Settings.tsx
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx
│   ├── lib/                 # Utilities and configuration
│   │   └── supabase.ts
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── supabase/
│   ├── functions/           # Edge Functions
│   │   ├── ai-chat/
│   │   ├── auto-tag-recipe/
│   │   ├── get-recipe-image/
│   │   ├── import-recipe/
│   │   ├── admin-get-users/
│   │   ├── admin-update-user-status/
│   │   └── admin-delete-user/
│   └── migrations/          # Database migrations
└── package.json
```

## Database Schema

### Tables

- **user_profiles** - User information and approval status
- **user_preferences** - User dietary preferences and settings
- **recipes** - Recipe storage with ingredients and instructions
- **recipe_ratings** - User ratings for recipes
- **meals** - Meal planning entries
- **meal_recipes** - Junction table linking recipes to meals
- **chats** - AI chat conversations
- **chat_messages** - Individual messages in chats

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data.

## Security

- **Row Level Security (RLS)** - All database queries are secured at the database level
- **Admin Approval** - New users must be approved by an admin before accessing the app
- **Secure API Keys** - Edge Functions handle sensitive API keys server-side
- **HTTPS Only** - All communications encrypted
- **User Data Isolation** - Users can only access their own recipes, meals, and chats

## Build & Deploy

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Admin Approval System

The app uses an admin approval workflow:

1. **First User** - Automatically becomes an admin
2. **New Users** - See a "Pending Approval" screen after registration
3. **Admin Approval** - Admins can approve or reject users from the Admin Dashboard
4. **Access Granted** - Approved users gain full access to the app

See `ADMIN_APPROVAL_SYSTEM.md` for detailed implementation documentation.

## AI Features

The AI assistant can help you:

- **Find Recipes** - "I want something with chicken and mushrooms"
- **Handle Allergies** - "I'm allergic to nuts, what can I make?"
- **Get Substitutions** - "Can I substitute butter with olive oil?"
- **Plan Meals** - "Give me a meal plan for the week"
- **Learn Your Taste** - Recommendations improve based on your ratings

AI features require an OpenAI or Anthropic API key configured in your Supabase Edge Functions.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Development Roadmap

See `PRD.md` for the complete product roadmap and feature status.

### Coming Soon
- Shopping list generation from meal plans
- Calendar view for meal planning
- Recipe collections and folders
- Nutrition tracking
- Kitchen inventory management
- Batch cooking and meal prep features

## License

This project is private and proprietary.

## Support

For questions or issues, please open an issue in the repository or contact the development team.

## Acknowledgments

- Stock photos provided by [Pexels](https://www.pexels.com/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Bolt](https://bolt.new/)
