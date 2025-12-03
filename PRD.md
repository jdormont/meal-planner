# Product Requirements Document: AI Recipe & Meal Planning App

## Executive Summary
A comprehensive recipe management and meal planning application with AI-powered assistance for discovering recipes, planning weekly meals, and organizing multi-dish special occasion meals.

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

## Key Features

### Phase 1: Foundation (MVP)
**Goal:** Core recipe management and AI chat interface

#### 1.1 AI Chat Interface
- Natural language chat interface for recipe ideas
- Integration with AI API (user-provided API key)
- Contextual suggestions based on ingredients, cuisine, dietary preferences
- Ability to save AI-suggested recipes directly to database

#### 1.2 Recipe Management
- Create custom recipes with:
  - Title and description
  - Ingredient list with quantities
  - Step-by-step instructions
  - Prep time, cook time, total time
  - Serving size
  - Tags/categories (cuisine, dietary restrictions, meal type)
  - Optional: photos, notes, source URL
- Edit and delete recipes
- Search and filter recipes by:
  - Name
  - Ingredients
  - Tags/categories
  - Time requirements
- Recipe detail view with clear formatting

#### 1.3 Data Persistence
- Supabase database for all data storage
- User authentication (email/password)
- Cloud sync for cross-device access

### Phase 2: Meal Planning
**Goal:** Weekly meal planning and shopping list generation

#### 2.1 Weekly Meal Planner
- Calendar view for 7-day meal planning
- Drag-and-drop recipes to specific days/meals
- Multiple meals per day (breakfast, lunch, dinner, snacks)
- Save and name meal plans ("Week of Jan 1", "Summer Week 1")
- Clone/duplicate previous meal plans
- View meal plan history

#### 2.2 Shopping List Generator
- Automatic shopping list from weekly meal plan
- Combine ingredients from multiple recipes
- Smart quantity aggregation
- Categorize by grocery store sections
- Manual add/edit/remove items
- Check off items while shopping
- Export/print shopping list

### Phase 3: Special Occasion Planning
**Goal:** Coordinate multi-dish meals for events

#### 3.1 Event Meal Manager
- Create special occasion events (name, date, guest count)
- Add multiple recipes to single event
- Timeline view showing:
  - Prep schedule (what to do when)
  - Cooking order based on prep/cook times
  - Oven/stovetop coordination
- Ingredient list for entire event
- Serving size auto-scaling based on guest count

#### 3.2 Timeline Optimization
- Calculate when to start each dish
- Work backwards from serving time
- Visual timeline with overlapping tasks
- Identify bottlenecks (oven conflicts, etc.)
- Prep-ahead suggestions

### Phase 4: Enhanced Features
**Goal:** Polish and advanced functionality

#### 4.1 AI Chat Enhancements
- Recipe modification suggestions
- Ingredient substitutions
- Scaling recipes up/down
- Dietary restriction adaptations
- Meal plan generation from constraints
- "What can I make with these ingredients?"

#### 4.2 Social & Sharing
- Share individual recipes (public links)
- Share meal plans
- Export recipes to PDF
- Import recipes from URLs
- Community recipe suggestions (optional)

#### 4.3 Nutrition & Preferences
- Nutritional information tracking (optional)
- Dietary preference filters (vegan, gluten-free, etc.)
- Favorite recipes
- Recipe ratings and notes
- Cooking history

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

### AI Integration
- User-provided API key (OpenAI/Anthropic/etc.)
- Proxy API calls through Supabase Edge Functions
- Streaming responses for better UX

### Data Models

#### Users
- Managed by Supabase Auth
- User metadata: preferences, settings

#### Recipes
```
- id
- user_id (owner)
- title
- description
- ingredients (JSON array)
- instructions (JSON array)
- prep_time_minutes
- cook_time_minutes
- servings
- tags (array)
- image_url
- source_url
- notes
- created_at
- updated_at
```

#### Meal Plans
```
- id
- user_id
- name
- start_date
- meals (JSON: { day, meal_type, recipe_id })
- notes
- created_at
- updated_at
```

#### Special Events
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

#### Shopping Lists
```
- id
- user_id
- meal_plan_id (optional)
- event_id (optional)
- name
- items (JSON array)
- completed
- created_at
```

---

## Build Phases

### Phase 1: MVP (Weeks 1-2)
1. Set up Supabase database and authentication
2. Create recipe CRUD interface
3. Implement AI chat interface
4. Basic recipe search and filtering
5. Save AI suggestions to database

**Success Criteria:**
- Users can create, edit, delete recipes
- AI chat provides recipe suggestions
- Recipes saved and retrieved from Supabase
- Basic authentication working

### Phase 2: Meal Planning (Week 3)
1. Weekly calendar view
2. Assign recipes to days/meals
3. Save and retrieve meal plans
4. Generate shopping lists from meal plans

**Success Criteria:**
- Users can plan full week of meals
- Shopping list auto-generated
- Meal plans saved and reusable

### Phase 3: Special Occasions (Week 4)
1. Event creation interface
2. Multi-recipe coordination
3. Timeline calculator
4. Event-specific shopping list

**Success Criteria:**
- Users can plan multi-dish events
- Timeline shows optimal prep schedule
- Guest count scaling works

### Phase 4: Polish & Launch (Week 5+)
1. Enhanced AI capabilities
2. Recipe sharing features
3. Mobile optimization
4. Performance improvements
5. User testing and feedback

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

## Open Questions

1. Which AI provider API will be used? (OpenAI, Anthropic, etc.)
2. Should recipe images be required or optional?
3. What's the target max recipes per user? (affects performance)
4. Should there be recipe import from popular sites?
5. Is offline support needed?
6. Should users be able to share recipes publicly?

---

## Next Steps

1. **Review and approve PRD**
2. **Choose AI provider** and obtain API key
3. **Set up Supabase** project
4. **Begin Phase 1 development**
5. **Iterate based on user testing**
