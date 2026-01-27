import { useState, useEffect } from 'react';
import { AuthForm } from '../components/AuthForm';
import { RecipeSuggestionCard, RecipeSuggestion } from '../components/RecipeSuggestionCard';
import { Sparkles, ArrowRight, MessageSquare, Download, Heart, X, ChefHat, Calendar } from 'lucide-react';

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for sticky navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Mock Data for Fan Deck
  const fanDeckRecipes: RecipeSuggestion[] = [
    {
      title: "Spicy Rigatoni Vodka",
      description: "Creamy, spicy, and perfectly al dente. A weeknight classic elevated.",
      time_estimate: "25 min",
      difficulty: "Medium",
      cuisine: "Italian",
      reason_for_recommendation: "Trending now",
      image_url: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Crispy Salmon Bowl",
      description: "Pan-seared salmon with sushi rice, avocado, and spicy mayo.",
      time_estimate: "20 min",
      difficulty: "Easy",
      cuisine: "Japanese",
      reason_for_recommendation: "Healthy choice",
      image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80"
    },
    {
      title: "Birria Tacos",
      description: "Slow-cooked beef with consommé for dipping. The ultimate comfort food.",
      time_estimate: "3 hrs", 
      difficulty: "Hard",
      cuisine: "Mexican",
      reason_for_recommendation: "Data",
      image_url: "https://images.unsplash.com/photo-1624300626371-b6fa84305828?auto=format&fit=crop&w=600&q=80"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] texture-linen font-sans selection:bg-orange-100 selection:text-orange-900">
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-100 py-3 shadow-sm' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-8 w-auto" />
             <span className="font-bold text-xl tracking-tight text-gray-900 font-serif">Sous</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => openAuth('signin')}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
             >
                Sign In
             </button>
             <button 
                onClick={() => openAuth('signup')}
                className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium text-sm transition-all transform hover:scale-105 shadow-lg shadow-gray-200"
             >
                Get Started
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 lg:pt-24 lg:pb-24 overflow-visible px-6">
          <div className="max-w-4xl mx-auto text-center z-10 relative mb-12">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/50 border border-orange-200 text-orange-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in-up">
                <Sparkles size={12} />
                <span>Now with Smart Scaling</span>
             </div>
             
             <h1 className="text-5xl lg:text-7xl font-serif font-medium text-gray-900 tracking-tight leading-[1.1] mb-6 animate-fade-in-up delay-100">
                The AI Sous Chef that <span className="text-terracotta-500 italic">actually helps you cook.</span>
             </h1>
             
             <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
                Stop asking "What's for dinner?" Sous learns your tastes, scans your pantry, and plans your week in seconds.
             </p>
             
             <button 
                onClick={() => openAuth('signup')}
                className="bg-terracotta-500 hover:bg-terracotta-600 text-white text-lg px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 hover:shadow-xl shadow-terracotta-200 flex items-center gap-2 mx-auto animate-fade-in-up delay-300"
             >
                Get Started for Free
                <ArrowRight size={20} />
             </button>
          </div>

          {/* Fan Deck Visual Hook */}
          <div className="relative w-full max-w-sm h-96 mx-auto perspective-1000">
              {/* Card 1 (Left) - Behind */}
              <div className="hidden md:block absolute top-0 left-0 w-full transform -rotate-12 -translate-x-16 translate-y-4 shadow-xl rounded-xl z-0 bg-white transition-transform hover:-translate-y-2 duration-300">
                  <div className="pointer-events-none opacity-90">
                     <RecipeSuggestionCard suggestion={fanDeckRecipes[0]} onSave={async () => {}} onClick={() => {}} />
                  </div>
              </div>

               {/* Card 2 (Right) - Behind */}
               <div className="hidden md:block absolute top-0 left-0 w-full transform rotate-12 translate-x-16 translate-y-4 shadow-xl rounded-xl z-10 bg-white transition-transform hover:-translate-y-2 duration-300">
                  <div className="pointer-events-none opacity-90">
                     <RecipeSuggestionCard suggestion={fanDeckRecipes[2]} onSave={async () => {}} onClick={() => {}} />
                  </div>
              </div>

               {/* Card 3 (Center) - Front */}
               <div className="absolute top-0 left-0 w-full transform md:rotate-0 z-20 md:scale-105 shadow-2xl rounded-xl bg-white transition-transform hover:scale-105 duration-300">
                  <div className="pointer-events-none">
                     <RecipeSuggestionCard suggestion={fanDeckRecipes[1]} onSave={async () => {}} onClick={() => {}} />
                  </div>
              </div>
          </div>
      </section>

      {/* Bento Features Section */}
      <section className="py-16 bg-white border-t border-stone-100">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-12">
                  <h2 className="text-3xl lg:text-4xl font-serif text-gray-900 mb-4">Everything you need to master your kitchen.</h2>
              </div>

              {/* Strict Grid Structure */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[minmax(300px,auto)]">
                  
                  {/* Talk to Chef: md:col-span-4 bg-stone-50 */}
                  <div className="md:col-span-4 bg-stone-50 rounded-3xl p-8 md:p-10 border border-stone-100 relative overflow-hidden flex flex-col justify-between group">
                      <div className="relative z-10">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-sm">
                              <MessageSquare size={24} />
                          </div>
                          <h3 className="text-2xl font-bold font-serif text-gray-900 mb-2">Chat with your Chef</h3>
                          <p className="text-gray-600 max-w-md">
                              Ask for ideas, substitutions, or guidance. It's like having a pro in your pocket.
                          </p>
                      </div>
                      
                      {/* Visual: Mock Chat Bubbles */}
                      <div className="mt-8 relative max-w-lg space-y-3">
                          <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-stone-100 w-[80%] transform transition-transform group-hover:translate-x-1">
                              <p className="text-sm text-gray-600">
                                "I have some kale and chickpeas. What can I make?"
                              </p>
                          </div>
                          <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm p-4 shadow-sm ml-auto w-[85%] transform transition-transform group-hover:-translate-x-1 delay-75">
                              <p className="text-sm shadow-sm">
                                "How about a <span className="font-bold underlineDecoration-white">Crispy Chickpea Caesar?</span> Ready in 15 mins!"
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Import: md:col-span-2 bg-orange-50 */}
                  <div className="md:col-span-2 bg-orange-50 rounded-3xl p-8 border border-orange-100 relative overflow-hidden flex flex-col group hover:bg-orange-100 transition-colors">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-6 shadow-sm">
                          <Download size={24} />
                      </div>
                      <h3 className="text-xl font-bold font-serif text-gray-900 mb-2">Import Instantly</h3>
                      <p className="text-gray-600 text-sm mb-8">
                          Paste a URL or scan a page. We handle the rest.
                      </p>
                      <div className="mt-auto flex justify-center">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center transform group-hover:scale-110 transition-transform">
                              <ArrowRight className="text-orange-500" />
                          </div>
                      </div>
                  </div>

                  {/* Smart Scaling: md:col-span-2 md:row-span-2 */}
                  <div className="md:col-span-2 md:row-span-2 rounded-3xl relative overflow-hidden group">
                       <img 
                           src="/smart-scaling.png" 
                           alt="Smart Scaling Interface" 
                           className="absolute inset-0 w-full h-full object-cover object-left transition-transform duration-700 group-hover:scale-105"
                       />
                       <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
                       
                       <div className="relative z-10 p-8">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6">
                              <ChefHat size={24} />
                          </div>
                          <h3 className="text-xl font-bold font-serif text-white mb-2">Smart Scaling</h3>
                          <p className="text-white/90 text-sm">
                              Cooking for one or a crowd? Sous scales ingredients and times instantly.
                          </p>
                       </div>
                  </div>

                  {/* Meal Plan: md:col-span-4 bg-white border border-gray-200 */}
                  <div className="md:col-span-4 bg-white border border-gray-200 rounded-3xl p-8 md:p-10 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-8 group hover:border-gray-300 transition-colors">
                       <div className="flex-1">
                          <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center text-stone-600 mb-6">
                              <Calendar size={24} />
                          </div>
                          <h3 className="text-2xl font-bold font-serif text-gray-900 mb-2">Weekly Meal Planning</h3>
                          <p className="text-gray-600">
                              Drag and drop to plan. We'll generate your shopping list automatically.
                          </p>
                       </div>
                       
                       {/* Visual: Row of 7 small squares */}
                       <div className="flex-shrink-0 flex gap-2">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                              <div key={day} className={`w-10 h-14 rounded-lg flex flex-col items-center justify-center border transition-all duration-300 ${day === 'W' ? 'bg-orange-500 border-orange-500 text-white transform -translate-y-2 shadow-md' : 'bg-white border-gray-100 text-gray-400 group-hover:border-gray-200'}`}>
                                  <span className="text-[10px] font-bold mb-1">{day}</span>
                                  <div className={`w-1 h-1 rounded-full ${day === 'W' ? 'bg-white' : 'bg-gray-200'}`}></div>
                              </div>
                          ))}
                       </div>
                  </div>

              </div>
          </div>
      </section>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAuthModal(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <AuthForm mode={authMode} onSuccess={() => window.location.reload()} />
          </div>
        </div>
      )}
      
      {/* Footer */}
      <footer className="bg-white border-t border-stone-100 py-12 text-center text-gray-500 text-sm">
          <p>© 2026 Sous Chef AI. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-75 { animation-delay: 75ms; }
      `}</style>
    </div>
  );
}
