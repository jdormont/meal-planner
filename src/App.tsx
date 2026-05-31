import { useState, useEffect } from 'react';
import { Route, Switch, Redirect, useLocation } from 'wouter';
import { useAuth } from './contexts/AuthContext';
import { useAnalytics } from './hooks/useAnalytics';
import { LandingPage } from './pages/LandingPage';
import { AccountStatus } from './components/AccountStatus';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { Layout } from './components/Layout';
import { supabase } from './lib/supabase';
import { ShoppingListProvider } from './contexts/ShoppingListContext';
import { ShoppingListDrawer } from './components/ShoppingListDrawer';
import { parseIngredient } from './utils/recipeParser';
import { RecipeSuggestion } from './components/RecipeSuggestionCard';

// Pages
import { RecipesPage } from './pages/RecipesPage';
import { CommunityPage } from './pages/CommunityPage';
import { PlannerPage } from './pages/PlannerPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';

function App() {
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const { pageView } = useAnalytics();
  
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Track page views on location transitions
  useEffect(() => {
    if (user) {
      pageView(location);
    }
  }, [location, pageView, user]);

  const checkAndShowOnboarding = async () => {
    if (!user || !userProfile) return;

    if (userProfile.has_seen_onboarding === false) {
      setShowOnboardingWizard(true);
    }
  };

  useEffect(() => {
    if (!authLoading && user && userProfile) {
      checkAndShowOnboarding();
    }
  }, [authLoading, user, userProfile]);

  const markOnboardingSeen = async () => {
    if (!user) return;
    try {
      await supabase
        .from('user_profiles')
        .update({ has_seen_onboarding: true })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking onboarding as seen:', error);
    }
  };

  const handleWizardComplete = async (suggestion: RecipeSuggestion) => {
    setShowOnboardingWizard(false);
    await markOnboardingSeen();

    // Format the suggestion as a recipe payload
    const tempRecipe = {
      title: suggestion.title,
      description: suggestion.description,
      ingredients: suggestion.full_details?.ingredients.map((line: string) => parseIngredient(line)) || [],
      instructions: suggestion.full_details?.instructions || [],
      total_time: parseInt(suggestion.time_estimate) || 0,
      servings: 4,
      tags: ['AI Generated'],
      image_url: suggestion.image_url || '',
      source_url: '',
      notes: suggestion.full_details?.nutrition_notes || '',
      is_shared: false,
      recipe_type: 'food'
    };

    sessionStorage.setItem('temp_import_recipe', JSON.stringify(tempRecipe));
    setLocation('/recipes/new?source=onboarding');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center">
        <div className="text-center">
          <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ShoppingListProvider>
        <LandingPage />
      </ShoppingListProvider>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-cream-200 texture-linen flex items-center justify-center">
        <div className="text-center">
          <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (userProfile.status === 'PENDING' || userProfile.status === 'REJECTED') {
    return <AccountStatus />;
  }

  return (
    <ShoppingListProvider>
      <Layout
        userProfile={userProfile}
        signOut={signOut}
        onNewRecipe={() => setLocation('/recipes/new')}
        onNewMeal={() => setLocation('/planner/meals/new')}
        onOpenShoppingList={() => setShowShoppingList(true)}
      >
        <Switch>
          <Route path="/">
            <Redirect to="/recipes" />
          </Route>
          <Route path="/recipes" nest>
            <RecipesPage />
          </Route>
          <Route path="/community" nest>
            <CommunityPage />
          </Route>
          <Route path="/planner" nest>
            <PlannerPage />
          </Route>
          <Route path="/chat" component={ChatPage} />
          <Route path="/settings" component={SettingsPage} />
          {userProfile?.is_admin && <Route path="/admin" component={AdminPage} />}
          <Route>
            <Redirect to="/recipes" />
          </Route>
        </Switch>

        {showOnboardingWizard && (
          <OnboardingWizard onComplete={handleWizardComplete} />
        )}

        <ShoppingListDrawer
          isOpen={showShoppingList}
          onClose={() => setShowShoppingList(false)}
        />
      </Layout>
    </ShoppingListProvider>
  );
}

export default App;
