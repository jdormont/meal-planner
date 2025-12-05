# Product Requirements Document: AI Recipe & Meal Planning App

## Executive Summary
A comprehensive recipe management and meal planning application with AI-powered assistance for discovering recipes, planning weekly meals, and organizing multi-dish special occasion meals.

**Last Updated:** December 2025
**Current Status:** Phase 2 Complete - Core recipe management, AI chat, user preferences, meal planning, and admin system operational

## Recent Updates (December 2025)

### ✅ Completed This Month
1. **Advanced Allergy Safety System**
   - Comprehensive handling of dietary restrictions in AI prompts
   - Safe substitution suggestions with explanations
   - Flagging of hidden allergen sources in cuisine-specific ingredients
   - Multi-allergy coordination without conflicts

2. **Recipe Time Parsing Fix**
   - Fixed AI recipe parsing to correctly extract prep and cook times
   - Now supports "min", "minute", and "minutes" formats

3. **Admin System Enhancements**
   - User approval workflow fully operational
   - Admin dashboard with user management
   - Login tracking and account status monitoring

4. **AI Personalization Improvements**
   - Recipe recommendations based on rating history
   - Context-aware suggestions using user preferences
   - Comprehensive user settings integration

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

### 🚧 In Progress
- Shopping list generation from meal plans
- Calendar view for meal planning

### 📋 Planned
- Special occasion event planning with timeline optimization
- Recipe sharing and export
- Recipe import from URLs
- Nutrition tracking

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
  - ✅ Auto-generated images from stock photo sources
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
- 📋 Calendar view for 7-day planning (planned)
- 📋 Drag-and-drop interface (planned)
- 📋 Multiple meal types per day (breakfast, lunch, dinner) (planned)
- 📋 Clone/duplicate meal plans (planned)

#### 2.2 Shopping List Generator 📋 PLANNED
- 📋 Automatic shopping list from meal plan recipes
- 📋 Combine ingredients from multiple recipes
- 📋 Smart quantity aggregation
- 📋 Categorize by grocery store sections
- 📋 Manual add/edit/remove items
- 📋 Check off items while shopping
- 📋 Export/print shopping list

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
- 📋 Scaling recipes up/down (planned)

#### 4.2 Social & Sharing 📋 PLANNED
- 📋 Share individual recipes (public links)
- 📋 Share meal plans
- 📋 Export recipes to PDF
- 📋 Import recipes from URLs
- 📋 Community recipe suggestions (optional)

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
- ✅ **get-recipe-image** - Stock photo integration
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
5. 📋 Weekly calendar view (in progress)
6. 📋 Generate shopping lists from meals (planned)

**Success Criteria:**
- ✅ Users can create meals with multiple recipes
- ✅ Meals saved and retrievable
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
5. 📋 Mobile optimization (ongoing)
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

- Mobile app (React Native)
- Voice input for hands-free cooking
- Grocery delivery integration
- Recipe versioning
- Collaborative meal planning
- Recipe recommendations based on history
- Seasonal ingredient suggestions
- Cost estimation per recipe/meal plan

---

## Success Metrics

- User retention (weekly active users)
- Recipes created per user
- Meal plans created per week
- AI chat engagement
- Special events planned
- Recipe search success rate
- Time spent in app

---

## Questions & Decisions

### ✅ Resolved
1. **Which AI provider API will be used?**
   - ✅ Both OpenAI (GPT-4o-mini) and Anthropic (Claude 3.5 Sonnet) supported
   - System detects provider based on API key format

2. **Should recipe images be required or optional?**
   - ✅ Optional - Auto-generated from stock photos (Pexels)
   - Users not required to provide images

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
1. Should there be recipe import from popular sites?
2. Is offline support needed?
3. Should users be able to share recipes publicly?
4. What's the target max recipes per user? (affects performance)
5. Should meal plans have separate breakfast/lunch/dinner slots?
6. Should there be collaborative meal planning features?

---

## Next Steps

### Immediate Priorities
1. **Complete Meal Planning Features**
   - Implement calendar view for weekly meal planning
   - Add drag-and-drop interface for recipes
   - Support multiple meal types per day (breakfast, lunch, dinner)

2. **Shopping List Generator**
   - Auto-generate shopping lists from meals
   - Combine and aggregate ingredients
   - Categorize by store sections
   - Add manual edit capabilities

3. **Mobile Optimization**
   - Improve responsive design for mobile devices
   - Touch-friendly interactions
   - Mobile-specific UI improvements

### Future Development
4. **Special Occasion Planning (Phase 3)**
   - Event creation and management
   - Timeline optimization for multi-dish meals
   - Guest count scaling

5. **Sharing & Export Features**
   - Public recipe links
   - PDF export
   - Recipe import from URLs

6. **Analytics & Insights**
   - Cooking history tracking
   - Recipe popularity metrics
   - Personalized recommendations based on usage patterns

### Ongoing
- User testing and feedback collection
- Performance optimization
- Bug fixes and refinements
- Documentation updates
