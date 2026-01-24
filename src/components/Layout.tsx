import React, { useState } from 'react';
import { BookOpen, Users, Calendar, ChefHat, Sparkles, Plus, User, Shield, Settings as SettingsIcon, LogOut, ShoppingCart } from 'lucide-react';
import { UserProfile } from '../lib/supabase';

export type View = 'recipes' | 'community' | 'meals' | 'chat' | 'settings' | 'admin';

type LayoutProps = {
    children: React.ReactNode;
    currentView: View;
    onViewChange: (view: View) => void;
    userProfile: UserProfile | null;
    signOut: () => Promise<void>;
    onNewRecipe: () => void;
    onNewMeal: () => void;
    onOpenShoppingList?: () => void;
};

export function Layout({
    children,
    currentView,
    onViewChange,
    userProfile,
    signOut,
    onNewRecipe,
    onNewMeal,
    onOpenShoppingList,
}: LayoutProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);

    return (
        <div className="min-h-screen bg-cream-200 texture-linen">
            <header className="bg-cream-50 shadow-sm border-b border-sage-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        <div
                            className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer"
                            onClick={() => onViewChange('recipes')}
                        >
                            <img src="/gemini_generated_image_9fuv9w9fuv9w9fuv-remove-background.com.png" alt="Sous" className="h-8 sm:h-10 flex-shrink-0" />
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Sous</h1>
                                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Plan less. Cook smarter</p>
                            </div>
                        </div>

                        <nav className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                            <button
                                onClick={() => onViewChange('recipes')}
                                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${currentView === 'recipes'
                                    ? 'bg-terracotta-500 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-sage-100'
                                    }`}
                                title="My Recipes"
                            >
                                <BookOpen className="w-5 h-5" />
                                <span className="hidden md:inline">My Recipes</span>
                            </button>

                            <button
                                onClick={() => onViewChange('community')}
                                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${currentView === 'community'
                                    ? 'bg-terracotta-500 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-sage-100'
                                    }`}
                                title="Community Recipes"
                            >
                                <Users className="w-5 h-5" />
                                <span className="hidden md:inline">Community</span>
                            </button>

                            <button
                                onClick={() => onViewChange('meals')}
                                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${currentView === 'meals'
                                    ? 'bg-terracotta-500 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-sage-100'
                                    }`}
                                title="Meal Planning"
                            >
                                <Calendar className="w-5 h-5" />
                                <span className="hidden md:inline">Meals</span>
                            </button>

                            <button
                                onClick={() => onViewChange('chat')}
                                className={`px-2 sm:px-3 py-2 min-h-[44px] rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium touch-manipulation ${currentView === 'chat'
                                    ? 'bg-terracotta-500 text-white shadow-sm'
                                    : 'text-gray-700 hover:bg-sage-100'
                                    }`}
                                title="Chef Assistant"
                            >
                                <div className="relative">
                                    <ChefHat className="w-5 h-5" />
                                    <Sparkles className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5" />
                                </div>
                                <span className="hidden md:inline">Chef</span>
                            </button>

                            <div className="hidden sm:block h-6 w-px bg-gray-300 mx-1"></div>

                            {currentView !== 'community' && (
                                <button
                                    onClick={() => {
                                        if (currentView === 'meals') {
                                            onNewMeal();
                                        } else {
                                            onNewRecipe();
                                        }
                                    }}
                                    className="px-2 sm:px-3 py-2 min-h-[44px] bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl transition flex items-center gap-1 sm:gap-2 font-medium shadow-sm touch-manipulation"
                                    title={currentView === 'meals' ? 'New Meal' : 'New Recipe'}
                                >
                                    <Plus className="w-5 h-5" />
                                    <span className="hidden lg:inline">{currentView === 'meals' ? 'New' : 'New'}</span>
                                </button>
                            )}
                            
                            {onOpenShoppingList && (
                                <button
                                    onClick={onOpenShoppingList}
                                    className="p-2 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center justify-center touch-manipulation"
                                    title="Shopping List"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                </button>
                            )}

                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="p-2 min-h-[44px] min-w-[44px] text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center justify-center touch-manipulation"
                                    title="User menu"
                                >
                                    <User className="w-5 h-5" />
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowUserMenu(false)}
                                        ></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                            {userProfile?.is_admin && (
                                                <button
                                                    onClick={() => {
                                                        onViewChange('admin');
                                                        setShowUserMenu(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                    Admin Panel
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    onViewChange('settings');
                                                    setShowUserMenu(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                            >
                                                <SettingsIcon className="w-4 h-4" />
                                                Settings
                                            </button>
                                            <hr className="my-1 border-gray-200" />
                                            <button
                                                onClick={signOut}
                                                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Sign Out
                                            </button>
                                            <hr className="my-1 border-gray-200" />
                                            <a
                                                href="/privacy"
                                                className="w-full px-4 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                Privacy & Terms
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
                {children}
            </main>
        </div>
    );
}
