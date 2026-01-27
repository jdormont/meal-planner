# Product Requirements Document: AI Recipe & Meal Planning App

## Executive Summary
A comprehensive recipe management and meal planning application with AI-powered assistance for discovering recipes, planning weekly meals, and organizing multi-dish special occasion meals.

**Last Updated: January 26, 2026**
Current Status: Phase 2 & 4 Active - Recipe Scaling, Onboarding, and Instacart Integration in focus.

## Recent Updates (Dec 2025 - Jan 2026)

### ✅ Completed This Week (Jan 20-26)
1. **Smart Recipe Scaling ("Ask Chef to Adjust")**
   - AI-powered recipe rescaling (servings, time, technique)
   - "Chef's Rationale" explaining adjustments (pan size, cooking time)
   - Automatic versioning of scaled recipes

2. **Recipe Card UI Polish**
   - Corrected time display logic (using `total_time`)
   - Prioritized attribution tags ("Imported", "AI Generated")
   - Cleaned up duplicate information (removed overlay time)

3. **Instacart Integration (Beta)**
   - Turn recipes into persistent shopping lists
   - Smart ingredient parsing and aggregation
   - One-click checkout via Instacart Connect API

4. **Onboarding Wizard (FTUE)**
   - Interactive questionnaire for new users (Allergies, Skill, Time)
   - "First Wow": Instant personalized recipe suggestions
   - Skill-based and time-based filtering for first experience

### ✅ Completed Earlier in Jan 2026
1. **Drag-and-Drop Meal Planning**
   - Interactive calendar with drag-and-drop support
   - Seamlessly move meals between days
   - Visual feedback during drag operations
   - Improved meal creation flow

2. **AI Image Generation (DALL-E 3)**
   - Replaced stock photo integration with custom AI image generation
   - Generates photorealistic, appetizing food images
   - Uses recipe title, description, and key ingredients for context
   - Automatically stores images in Supabase Storage

### ✅ Completed Last Month (Dec 2025)
1. **Advanced Cuisine Profiles**
   - Detailed cuisine preference management
   - Granular control over favorite cuisines and dishes
   - Better personalization for AI suggestions

2. **Empty State Onboarding Flow Optimization**
   - Reordered initial action CTAs for better UX flow (left-to-right)
   - Moved "Suggested starting point" badge to "Ask the AI" to guide new users toward AI assistance first
   - New order: Ask the AI → Import from Web or Photo → Create a Recipe
   - Improved user guidance for new recipe collection discovery

3. **Recipe Sharing & Community Features**
   - Public/private recipe visibility toggle
   - Community recipes browsing
   - View and adopt recipes shared by other users
   - Copy community recipes to personal collection

4. **Recipe Import from URLs**
   - Automatic recipe extraction from popular cooking websites
   - AI-powered parsing of ingredients, instructions, and metadata
   - One-click import directly into recipe collection

5. **Cocktail & Beverage Support**
   - Recipe type field (food/drink) added
   - Dedicated cocktail recipe management
   - Beverage-specific categorization and filtering

6. **Advanced Allergy Safety System**
   - Comprehensive handling of dietary restrictions in AI prompts
   - Safe substitution suggestions with explanations
   - Flagging of hidden allergen sources in cuisine-specific ingredients
   - Multi-allergy coordination without conflicts

7. **Recipe Time Parsing Fix**
   - Fixed AI recipe parsing to correctly extract prep and cook times
   - Now supports "min", "minute", and "minutes" formats

8. **Admin System Enhancements**
   - User approval workflow fully operational
   - Admin dashboard with user management
   - Login tracking and account status monitoring

9. **AI Personalization Improvements**
   - Recipe recommendations based on rating history
   - Context-aware suggestions using user preferences
   - Comprehensive user settings integration

10. **Mobile Responsiveness & Cooking Mode**
    - Optimized "Cooking Mode" for tablet landscape users
    - Sticky ingredients list for easy reference while cooking
    - Improved touch targets and mobile navigation
    - Custom scrollbars for better utility

11. **Chat-to-Plan (AI Meal Planning)**
    - AI-driven weekly meal plan generation
    - "Weekly Brief" mode for quick planning
    - Integration with user preferences and constraints

12. **Weekly Meal Calendar & Collections**
    - Interactive weekly/monthly calendar view
    - Support for Breakfast, Lunch, and Dinner slots
    - "Collections" feature for grouping meals (e.g., event planning)
    - Responsive "Meal Form" with auto-complete recipe search


## Core User Problems
1. Difficulty organizing and storing personal recipes
2. Time-consuming meal planning for weekly shopping
3. Complex coordination needed for special occasion meals with multiple dishes
4. Need for recipe inspiration and AI-powered suggestions
5. Desire to access recipes and meal plans from anywhere

## Target Users
- Home cooks who want better recipe organization
- People who meal prep and plan weekly menus
- Hosts who organize special occasion meals (holidays, dinner parties)
- Users who want AI assistance for recipe discovery

---

## Implementation Status

### ✅ Completed Features
- **Recipe Management** - Full CRUD operations with search and filtering
- **AI Chat Interface** - Multi-chat support with conversation history
- **User Authentication** - Email/password with admin approval workflow
- **User Preferences** - Comprehensive settings for personalization
- **Recipe Ratings** - Thumbs up/down with optional feedback
- **Meal Planning** - Date-based meals with recipe associations
- **Admin Dashboard** - User management and approval system
- **AI Personalization** - Context-aware suggestions based on preferences and ratings
- **Allergy Safety** - Comprehensive handling of dietary restrictions and allergies
- **Recipe Parsing** - AI-generated recipes automatically parsed and saved
- **Recipe Sharing** - Public/private recipes with community browsing
- **Recipe Import** - Import recipes from URLs with AI-powered extraction
- **Cocktail Support** - Beverage recipe management with dedicated type field
- **Auto-Tagging** - AI-powered automatic recipe categorization
- **Mobile Optimization** - Responsive design with tablet-specific "Cooking Mode"
- **Chat-to-Plan** - AI converts user requests into structured weekly meal plans
- **Calendar View** - Interactive weekly/monthly planner with multiple meal slots
- **Meal Collections** - Group meals for events or special occasions separate from the calendar
- **Responsive UI** - Optimized meal creation flow for all devices
- **Drag-and-Drop** - Drag-and-drop interface for organizing meals on the calendar
- **AI Image Generation** - Custom food images generated via DALL-E 3
- **Smart Scaling** - "Ask Chef to Adjust" for intelligent recipe resizing
- **Onboarding Wizard** - Personalized first-time user experience
- **Shopping Lists** - Persistent lists with Instacart integration

### 🚧 In Progress
- Special occasion event planning (Phase 3)

### 📋 Planned
- Recipe collections/folders
- Recipe versioning and history
- Nutrition tracking
- Kitchen inventory management
- Batch cooking and meal prep features
- Print-friendly recipe view

---

## Key Features

### Phase 1: Foundation (MVP) ✅ COMPLETE
**Goal:** Core recipe management and AI chat interface

#### 1.1 AI Chat Interface ✅ COMPLETE
- ✅ Natural language chat interface for recipe ideas
- ✅ Integration with AI API (OpenAI and Anthropic support)
- ✅ Contextual suggestions based on user preferences, cuisine, dietary restrictions
- ✅ Ability to save AI-suggested recipes directly to database
- ✅ Multi-chat support with conversation history
- ✅ Recipe recommendations based on rating history
- ✅ Comprehensive allergy and dietary restriction handling
- ✅ Safe substitution suggestions
- ✅ Auto-parsing of prep time, cook time, ingredients, and instructions

#### 1.2 Recipe Management ✅ COMPLETE
- ✅ Create custom recipes with:
  - ✅ Title and description
  - ✅ Ingredient list with quantities and units
  - ✅ Step-by-step instructions
  - ✅ Prep time, cook time, total time
  - ✅ Serving size
  - ✅ Tags/categories (cuisine, dietary restrictions, meal type)
  - ✅ Auto-generated images (DALL-E 3)
  - ✅ Notes field
  - ✅ AI-generated tag suggestions
- ✅ Edit and delete recipes
- ✅ Search and filter recipes by:
  - ✅ Name
  - ✅ Ingredients
  - ✅ Tags/categories
  - ✅ Description
- ✅ Recipe detail view with clear formatting
- ✅ Recipe rating system (thumbs up/down with feedback)

#### 1.3 Data Persistence ✅ COMPLETE
- ✅ Supabase database for all data storage
- ✅ User authentication (email/password)
- ✅ Cloud sync for cross-device access
- ✅ Row Level Security (RLS) on all tables
- ✅ Admin approval workflow for new users

### Phase 2: Meal Planning 🚧 PARTIALLY COMPLETE
**Goal:** Weekly meal planning and shopping list generation

#### 2.1 Weekly Meal Planner 🚧 PARTIALLY COMPLETE
- ✅ Create meals with date, name, and notes
- ✅ Link multiple recipes to meals
- ✅ Recipe completion tracking per meal
- ✅ Meal detail view with all recipes
- ✅ Edit and delete meals
- ✅ Archive system for past meals
- ✅ View meal history
- ✅ Calendar view for 7-day planning
- ✅ Drag-and-drop interface (implemented)
- ✅ Multiple meal types per day (breakfast, lunch, dinner)
- ✅ **New Feature: Collections** - Create independent lists of meals (e.g., "Camping Trip 2026")
- 📋 Clone/duplicate meal plans (planned)

#### 2.2 Shopping List & Instacart ✅ BETA
- ✅ Automatic shopping list from meal plan recipes
- ✅ Combine ingredients from multiple recipes
- ✅ Smart parsing of ingredient strings
- ✅ **Instacart Integration**: One-click checkout via Instacart Connect
- ✅ Persistent shopping lists saved to database
- 📋 Categorize by grocery store sections (planned)
- 📋 Check off items while shopping (planned)

### Phase 3: Special Occasion Planning 📋 PLANNED
**Goal:** Coordinate multi-dish meals for events

#### 3.1 Event Meal Manager 📋 PLANNED
- 📋 Create special occasion events (name, date, guest count)
- 📋 Add multiple recipes to single event
- 📋 Timeline view showing:
  - 📋 Prep schedule (what to do when)
  - 📋 Cooking order based on prep/cook times
  - 📋 Oven/stovetop coordination
- 📋 Ingredient list for entire event
- 📋 Serving size auto-scaling based on guest count

#### 3.2 Timeline Optimization 📋 PLANNED
- 📋 Calculate when to start each dish
- 📋 Work backwards from serving time
- 📋 Visual timeline with overlapping tasks
- 📋 Identify bottlenecks (oven conflicts, etc.)
- 📋 Prep-ahead suggestions

### Phase 4: Enhanced Features 🚧 PARTIALLY COMPLETE
**Goal:** Polish and advanced functionality

#### 4.1 AI Chat Enhancements ✅ COMPLETE
- ✅ Recipe modification suggestions
- ✅ Ingredient substitutions
- ✅ Dietary restriction adaptations (comprehensive allergy handling)
- ✅ Meal plan generation from constraints
- ✅ "What can I make with these ingredients?"
- ✅ Context-aware suggestions based on user preferences
- ✅ Learning from recipe ratings
- ✅ **Smart Scaling**: Intelligent recipe resizing (servings, equipment, time)
- 📋 Scaling recipes up/down (planned) - **COMPLETED**

#### 4.2 Social & Sharing 🚧 PARTIALLY COMPLETE
- ✅ Share individual recipes (public/private toggle)
- ✅ Community recipe browsing
- ✅ Import recipes from URLs
- ✅ Copy community recipes to personal collection
- 📋 Share meal plans (planned)
- 📋 Export recipes to PDF (planned)
- 📋 Recipe comments and ratings from community (planned)

#### 4.3 Nutrition & Preferences ✅ COMPLETE
- ✅ Dietary preference filters and settings
- ✅ Recipe ratings and feedback
- ✅ User preferences (cuisines, dishes, dietary style)
- ✅ Food restrictions and allergy management
- ✅ Cooking time preferences
- ✅ Skill level tracking
- ✅ Household size settings
- ✅ Spice preference settings
- ✅ Equipment availability tracking
- 📋 Nutritional information tracking (planned)
- 📋 Cooking history analytics (planned)

### Phase 5: Admin & Security ✅ COMPLETE
**Goal:** User management and security controls

#### 5.1 Admin Dashboard ✅ COMPLETE
- ✅ Admin user role system
- ✅ User approval workflow (PENDING, APPROVED, REJECTED states)
- ✅ View all registered users
- ✅ Approve or reject new user registrations
- ✅ Delete user accounts
- ✅ Track user login counts
- ✅ Account status management
- ✅ Comprehensive Row Level Security (RLS) policies

#### 5.2 Advanced Allergy Safety System ✅ COMPLETE
- ✅ Comprehensive allergy handling in AI prompts
- ✅ Acknowledge restrictions clearly in recipe suggestions
- ✅ Avoid all restricted ingredients and hidden sources
- ✅ Proactive safe substitution suggestions
- ✅ Flag cuisine-specific allergen ingredients
- ✅ Never suggest trace amounts of allergens
- ✅ Handle multiple allergies simultaneously
- ✅ Provide alternative methods when restrictions change dishes
- ✅ Label checking reminders for packaged ingredients

---

## Technical Architecture

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Responsive design (mobile + desktop)

### Backend & Database
- **Supabase** for:
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS)
  - Real-time sync
  - Cloud storage (recipe images)

### AI Integration ✅ IMPLEMENTED
- ✅ Support for both OpenAI (GPT-4o-mini) and Anthropic (Claude 3.5 Sonnet)
- ✅ API calls proxied through Supabase Edge Functions
- ✅ Context-aware prompts with user preferences
- ✅ Recipe rating history integration
- ✅ Comprehensive allergy safety guidelines
- ✅ Structured recipe parsing and saving

### Supabase Edge Functions ✅ DEPLOYED
- ✅ **ai-chat** - Main AI assistant with personalization
- ✅ **auto-tag-recipe** - Automatic recipe categorization
- ✅ **get-recipe-image** - AI Image Generation (DALL-E 3)
- ✅ **import-recipe** - Import recipes from URLs with AI extraction
- ✅ **admin-get-users** - User management for admins
- ✅ **admin-update-user-status** - User approval workflow
- ✅ **admin-delete-user** - User account deletion

### Data Models ✅ IMPLEMENTED

#### Users (Supabase Auth) ✅
- Managed by Supabase Auth
- Email/password authentication

#### User Profiles ✅ NEW
```
- id (references auth.users)
- email
- status (PENDING, APPROVED, REJECTED)
- is_admin (boolean)
- login_count
- created_at
- updated_at
```

#### User Preferences ✅ NEW
```
- id
- user_id
- favorite_cuisines (array)
- favorite_dishes (array)
- dietary_style
- food_restrictions (array)
- time_preference
- skill_level
- household_size
- spice_preference
- cooking_equipment (array)
- additional_notes
- created_at
- updated_at
```

#### Recipes ✅
```
- id
- user_id (owner)
- title
- description
- ingredients (JSON array: { name, quantity, unit })
- instructions (array)
- prep_time_minutes
- cook_time_minutes
- servings
- tags (array)
- image_url
- notes
- type (food, drink) - NEW
- is_public (boolean) - NEW
- created_at
- updated_at
```

#### Recipe Ratings ✅ NEW
```
- id
- user_id
- recipe_id
- rating (thumbs_up, thumbs_down)
- feedback (optional text)
- created_at
```

#### Chats ✅ NEW
```
- id
- user_id
- title
- created_at
- updated_at
```

#### Chat Messages ✅ NEW
```
- id
- chat_id
- role (user, assistant)
- content
- created_at
```

#### Meals ✅
```
- id
- user_id
- name
- date
- notes
- is_archived
- created_at
- updated_at
```

#### Meal Recipes ✅ NEW
```
- id
- meal_id
- recipe_id
- user_id
- sort_order
- is_completed
- created_at
- updated_at
```

#### Special Events 📋 PLANNED
```
- id
- user_id
- name
- event_date
- guest_count
- recipes (array of recipe_ids)
- timeline (JSON)
- notes
- created_at
- updated_at
```

#### Shopping Lists 📋 PLANNED
```
- id
- user_id
- meal_id (optional)
- event_id (optional)
- name
- items (JSON array)
- completed
- created_at
```

---

## Build Phases

### Phase 1: MVP ✅ COMPLETE
1. ✅ Set up Supabase database and authentication
2. ✅ Create recipe CRUD interface
3. ✅ Implement AI chat interface
4. ✅ Basic recipe search and filtering
5. ✅ Save AI suggestions to database
6. ✅ Recipe ratings system
7. ✅ User preferences and settings

**Success Criteria:** ✅ ALL MET
- ✅ Users can create, edit, delete recipes
- ✅ AI chat provides personalized recipe suggestions
- ✅ Recipes saved and retrieved from Supabase
- ✅ Authentication with admin approval working
- ✅ Recipe parsing from AI responses

### Phase 2: Meal Planning 🚧 PARTIALLY COMPLETE
1. ✅ Meal creation with date and notes
2. ✅ Link recipes to meals
3. ✅ Save and retrieve meals
4. ✅ Recipe completion tracking
5. ✅ Weekly calendar view
6. 📋 Generate shopping lists from meals (planned)

**Success Criteria:**
- ✅ Users can create meals with multiple recipes
- ✅ Meals saved and retrievable
- ✅ Users can visually plan meals across a weekly calendar
- ✅ Support for breakfast, lunch, and dinner slots
- 📋 Shopping list auto-generation (planned)
- 📋 Full calendar view (planned)

### Phase 3: Special Occasions 📋 PLANNED
1. 📋 Event creation interface
2. 📋 Multi-recipe coordination
3. 📋 Timeline calculator
4. 📋 Event-specific shopping list

**Success Criteria:**
- 📋 Users can plan multi-dish events
- 📋 Timeline shows optimal prep schedule
- 📋 Guest count scaling works

### Phase 4: Polish & Enhancement 🚧 IN PROGRESS
1. ✅ Enhanced AI capabilities (personalization, allergies, ratings)
2. ✅ Admin dashboard and user management
3. ✅ Comprehensive allergy safety system
4. 📋 Recipe sharing features (planned)
5. ✅ Mobile optimization (Cooking Mode implemented)
6. 📋 Performance improvements (ongoing)
7. 📋 User testing and feedback (ongoing)

---

## User Experience Principles

### Design
- Clean, modern interface with excellent readability
- Recipe cards with appetizing visuals
- Intuitive drag-and-drop interactions
- Clear information hierarchy
- Professional color palette (avoid purple/violet)

### Usability
- Quick access to frequently used features
- Minimal clicks to accomplish tasks
- Smart defaults and suggestions
- Clear feedback for all actions
- Responsive on all devices

### Performance
- Fast search and filtering
- Optimistic UI updates
- Progressive loading for large lists
- Efficient database queries

---

## Security & Privacy

- Row Level Security (RLS) on all tables
- Users can only access their own data
- Secure API key storage
- HTTPS for all communications
- No shared data without explicit user action

---

## Future Considerations

### Platform Expansion
- Native mobile app (React Native/Flutter)
- Progressive Web App (PWA) for offline access
- Browser extensions for recipe capture

### Smart Kitchen Integration
- Voice input for hands-free cooking
- Smart appliance integration (instant pot, air fryer timers)
- Kitchen display mode for tablets

### Shopping & Delivery
- Grocery delivery service integration
- Price comparison across stores
- Digital coupon integration
- Store loyalty program connections

### Social Features
- Collaborative meal planning with household members
- Recipe sharing with friends and family
- Cooking groups and challenges
- Recipe contests and featured creators

### Advanced AI Features
- Image recognition for ingredient identification
- Voice-to-recipe (describe what you want, get suggestions)
- Meal plan optimization for nutrition goals
- Budget-aware meal planning
- Zero-waste cooking suggestions

---

## Success Metrics

### User Engagement
- Weekly active users (WAU) and monthly active users (MAU)
- User retention rate (30-day, 90-day)
- Average session duration
- Sessions per user per week

### Content Creation
- Recipes created per user (average and median)
- Meal plans created per week
- Public recipes shared (adoption rate)
- Recipe ratings submitted

### AI Interaction
- AI chat sessions per user
- Messages per chat session
- Recipe adoption rate from AI suggestions
- Recipe import success rate

### Feature Usage
- Recipe search frequency and success rate
- Community recipe browsing engagement
- Recipe import usage
- Settings customization rate (preferences filled out)

### Growth & Retention
- New user registration rate
- Admin approval turnaround time
- User churn rate
- Feature adoption over time

---

## Questions & Decisions

### ✅ Resolved
1. **Which AI provider API will be used?**
   - ✅ Both OpenAI (GPT-4o-mini) and Anthropic (Claude 3.5 Sonnet) supported
   - System detects provider based on API key format

2. **Should recipe images be required or optional?**
   - ✅ Optional - Auto-generated using DALL-E 3 AI
   - Users not required to provide images
   - System automatically generates high-quality food images based on recipe details

3. **User approval workflow?**
   - ✅ Implemented admin approval system
   - New users start in PENDING status
   - Admins can approve, reject, or delete users

4. **How to handle allergies and dietary restrictions?**
   - ✅ Comprehensive system implemented
   - AI provides safe substitutions
   - Flags hidden allergen sources
   - Never suggests trace amounts

### 📋 Open Questions
1. What's the target max recipes per user? (affects performance and pagination strategy)
2. Should meal plans have separate breakfast/lunch/dinner slots or stay flexible?
3. Should there be collaborative meal planning features for households?
4. How should recipe versioning work? (track all changes vs. major versions only)
5. Should we add recipe comments/reviews on community recipes?
6. How to handle recipe licensing and attribution for imported recipes?
7. Should there be a freemium model or keep it fully free?
8. What level of nutrition tracking do users need? (basic macros vs. detailed micronutrients)
9. Should we support recipe video uploads or links?
10. How to prevent spam/inappropriate content in public recipes?

---

## Next Steps

### Immediate Priorities (Q1 2026)
1. **Complete Meal Planning Features**
   - ✅ Implement calendar view for weekly meal planning
   - ✅ Add drag-and-drop interface for recipes
   - ✅ Support multiple meal types per day (breakfast, lunch, dinner)
   - 📋 Clone/duplicate meal plans for easy reuse

2. **Shopping List Generator**
   - Auto-generate shopping lists from meals
   - Combine and aggregate ingredients intelligently
   - Categorize by grocery store sections
   - Add manual edit/add/remove capabilities
   - Check-off items while shopping
   - Export/print shopping list

3. **Mobile Optimization** (PHASE 1 COMPLETE)
   - ✅ Improve responsive design for mobile devices
   - ✅ Touch-friendly interactions
   - ✅ Mobile-specific UI improvements
   - 📋 Progressive Web App (PWA) capabilities

### Mid-Term Development (Q2 2026)
4. **Recipe Organization Enhancements**
   - Recipe collections/folders for better organization
   - Favorite recipes bookmarking system
   - Advanced filtering (by rating, date added, last cooked)
   - Recipe search improvements

5. **Special Occasion Planning (Phase 3)**
   - Event creation and management
   - Timeline optimization for multi-dish meals
   - Guest count scaling
   - Oven/stovetop coordination
   - Prep-ahead suggestions

6. **Enhanced Sharing & Export**
   - PDF export with print-friendly formatting
   - Share meal plans with others
   - Recipe comments from community users
   - Recipe ratings on community recipes

### Long-Term Vision (Q3-Q4 2026)
7. **Kitchen Management**
   - Kitchen inventory tracking
   - Pantry management
   - Expiration date tracking
   - "What can I make?" based on inventory
   - Leftover tracking and suggestions

8. **Batch Cooking & Meal Prep**
   - Batch cooking recipes and guides
   - Meal prep workflows
   - Container/portion planning
   - Reheating instructions

9. **Recipe Intelligence**
   - Recipe versioning and change history
   - Cooking notes and modifications log
   - "Last cooked" tracking
   - Seasonal ingredient suggestions
   - Cost estimation per recipe

10. **Nutrition & Health**
    - Nutritional information calculation
    - Macro tracking
    - Dietary goal monitoring
    - Health-focused meal planning

11. **Analytics & Insights**
    - Cooking history and patterns
    - Recipe popularity metrics
    - Personalized recommendations based on usage
    - Cost analysis and budgeting

### Ongoing
- User testing and feedback collection
- Performance optimization
- Bug fixes and refinements
- Documentation updates
- Security audits and improvements
