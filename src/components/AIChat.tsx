import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Save, MessageSquare, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { marked } from 'marked';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  cuisineMetadata?: {
    applied: boolean;
    cuisine: string;
    styleFocus: string;
    confidence: string;
    rationale: string;
    allMatches: string;
  };
};

type AIChatProps = {
  onSaveRecipe?: (recipeText: string, userQuery?: string) => void;
  onFirstAction?: () => void;
};

type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function AIChat({ onSaveRecipe, onFirstAction }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI cooking assistant. I specialize in quick weeknight recipes you can make in 30-40 minutes with common ingredients. Try one of the quick prompts below, or ask me anything about recipes, meal planning, or cooking!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showChatList, setShowChatList] = useState(true);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [currentModel, setCurrentModel] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setIsAdmin(data.is_admin || false);
    }
  };

  const loadChats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('chats')
      .select('*')
      .order('updated_at', { ascending: false });

    if (data) {
      setChats(data);
    }
  };

  const loadChat = async (chatId: string) => {
    const { data: chatMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (chatMessages) {
      setMessages(chatMessages as Message[]);
      setCurrentChatId(chatId);
      setShowChatList(false);
      setShowQuickPrompts(false);
    }
  };

  const createNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your AI cooking assistant. I specialize in quick weeknight recipes you can make in 30-40 minutes with common ingredients. Try one of the quick prompts below, or ask me anything about recipes, meal planning, or cooking!",
      },
    ]);
    setCurrentChatId(null);
    setShowChatList(false);
    setShowQuickPrompts(true);
  };

  const saveCurrentChat = async () => {
    if (!user || messages.length <= 1) return;

    const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'New Chat';
    const title = firstUserMessage.length > 50
      ? firstUserMessage.substring(0, 50) + '...'
      : firstUserMessage;

    if (currentChatId) {
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentChatId);
    } else {
      const { data: newChat } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title })
        .select()
        .single();

      if (newChat) {
        setCurrentChatId(newChat.id);

        const messagesToSave = messages.map(msg => ({
          chat_id: newChat.id,
          role: msg.role,
          content: msg.content,
        }));

        await supabase.from('chat_messages').insert(messagesToSave);
      }
    }

    await loadChats();
  };

  const saveNewMessage = async (message: Message) => {
    if (!currentChatId || !user) return;

    await supabase.from('chat_messages').insert({
      chat_id: currentChatId,
      role: message.role,
      content: message.content,
    });

    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentChatId);
  };

  const deleteChat = async (chatId: string) => {
    await supabase.from('chats').delete().eq('id', chatId);
    await loadChats();

    if (currentChatId === chatId) {
      createNewChat();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string, weeklyBrief?: boolean) => {
    const userMessage = (messageText || input).trim();
    if (!userMessage || loading) return;

    setInput('');
    setShowQuickPrompts(false);
    const newUserMessage = { role: 'user' as const, content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    if (currentChatId) {
      await saveNewMessage(newUserMessage);
    }

    try {
      let ratingHistory = [];
      let userPreferences = null;
      let isAdmin = false;

      if (user) {
        const { data: ratingsData } = await supabase
          .from('recipe_ratings')
          .select(`
            rating,
            feedback,
            recipes (
              title,
              tags
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        ratingHistory = ratingsData || [];

        const { data: prefsData } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        userPreferences = prefsData;

        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        isAdmin = profileData?.is_admin || false;
      }

      // Get the user's session token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
            ratingHistory,
            userPreferences,
            userId: user?.id,
            weeklyBrief: weeklyBrief || false,
            isAdmin,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.message,
        ...(data.cuisineMetadata && { cuisineMetadata: data.cuisineMetadata })
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.modelUsed) {
        setCurrentModel(data.modelUsed);
      }

      if (currentChatId) {
        await saveNewMessage(assistantMessage);
      } else {
        await saveCurrentChat();
      }

      if (onFirstAction) {
        onFirstAction();
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure your AI API is configured correctly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    {
      icon: '🥘',
      text: 'Quick weeknight dinner ideas',
      prompt: 'What are some easy 30-40 minute dinner recipes I can make with common pantry ingredients?',
      weeklyBrief: false
    },
    {
      icon: '🛒',
      text: 'Recipe with my ingredients',
      prompt: 'I have [list your ingredients]. What can I make for dinner tonight?',
      weeklyBrief: false
    },
    {
      icon: '📅',
      text: 'Help me meal plan',
      prompt: 'Help me plan dinners for this week',
      weeklyBrief: true
    },
    {
      icon: '💡',
      text: 'Recipe suggestions for me',
      prompt: 'Based on my preferences and what I\'ve liked before, suggest some recipes I would enjoy',
      weeklyBrief: false
    }
  ];

  return (
    <div className="flex h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Chat List Sidebar - Hidden on mobile unless showChatList is true */}
      <div className={`${showChatList ? 'flex' : 'hidden'} lg:flex w-full lg:w-80 border-r flex-col`}>
        <div className="p-4 border-b bg-gradient-to-r from-terracotta-600 to-warmtan-600">
          <button
            onClick={createNewChat}
            className="w-full px-4 py-3 bg-white hover:bg-cream-50 text-terracotta-600 rounded-xl transition flex items-center justify-center gap-2 font-medium touch-manipulation"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 rounded-xl mb-2 cursor-pointer transition group hover:bg-sage-50 ${
                currentChatId === chat.id ? 'bg-cream-50 border border-terracotta-200' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0" onClick={() => loadChat(chat.id)}>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {chat.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 lg:opacity-100 p-2 hover:bg-red-50 rounded-xl transition touch-manipulation"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window - Hidden on mobile when showChatList is true */}
      <div className={`${showChatList ? 'hidden' : 'flex'} lg:flex flex-col flex-1`}>
        <div className="bg-gradient-to-r from-terracotta-600 to-warmtan-600 text-white p-4">
          <div className="flex items-center gap-3">
            {/* Back button - only visible on mobile */}
            <button
              onClick={() => setShowChatList(true)}
              className="lg:hidden p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-2 bg-white bg-opacity-20 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg">AI Cooking Assistant</h2>
              <p className="text-sm text-cream-100 hidden sm:block">
                {currentModel ? `Powered by ${currentModel}` : 'Ask me anything about recipes and cooking'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showQuickPrompts && messages.length === 1 && (
          <div className="max-w-3xl mx-auto mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Start:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt.prompt, prompt.weeklyBrief)}
                  disabled={loading}
                  className="p-4 bg-white border-2 border-sage-200 rounded-xl hover:border-terracotta-500 hover:shadow-md transition text-left disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{prompt.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{prompt.text}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{prompt.prompt}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-terracotta-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-terracotta-600" />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-3xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-terracotta-600 text-white'
                  : 'bg-sage-50 text-gray-900'
              }`}
            >
              <div
                className="prose prose-sm max-w-none leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: message.role === 'assistant'
                    ? marked(message.content.replace('FULL_RECIPE', '').trim()) as string
                    : message.content
                }}
              />
              {message.role === 'assistant' && onSaveRecipe && idx > 0 && message.content.includes('FULL_RECIPE') && (
                <button
                  onClick={() => {
                    const userQuery = idx > 0 && messages[idx - 1]?.role === 'user'
                      ? messages[idx - 1].content
                      : '';
                    onSaveRecipe(message.content.replace('FULL_RECIPE', '').trim(), userQuery);
                  }}
                  className="mt-3 px-4 py-2 min-h-[44px] bg-white hover:bg-sage-50 text-terracotta-600 rounded-xl text-sm font-medium flex items-center gap-2 transition touch-manipulation"
                >
                  <Save className="w-4 h-4" />
                  Save as Recipe
                </button>
              )}
              {message.role === 'assistant' && isAdmin && message.cuisineMetadata && message.content.includes('FULL_RECIPE') && (
                <div className="mt-4 pt-4 border-t border-sage-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Generation Metadata (Admin Only)</div>
                  <div className="text-xs space-y-1 text-gray-600">
                    <div>
                      <span className="font-medium">Cuisine Profile Applied:</span>{' '}
                      {message.cuisineMetadata.applied ? '✅ Yes' : '❌ No'}
                    </div>
                    {message.cuisineMetadata.applied && (
                      <>
                        <div>
                          <span className="font-medium">Cuisine:</span>{' '}
                          {message.cuisineMetadata.cuisine} ({message.cuisineMetadata.styleFocus})
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>{' '}
                          {message.cuisineMetadata.confidence.charAt(0).toUpperCase() + message.cuisineMetadata.confidence.slice(1)}
                        </div>
                        <div>
                          <span className="font-medium">Rationale:</span>{' '}
                          {message.cuisineMetadata.rationale}
                        </div>
                        <div>
                          <span className="font-medium">All Competing Matches:</span>{' '}
                          {message.cuisineMetadata.allMatches}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-terracotta-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-terracotta-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-terracotta-600" />
            </div>
            <div className="bg-sage-50 rounded-3xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-sage-600 animate-spin" />
            </div>
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4 bg-white">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me for recipe ideas, cooking tips, or substitutions..."
            rows={2}
            className="flex-1 px-4 py-3 border border-sage-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none resize-none text-base"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-3 min-h-[44px] bg-terracotta-600 hover:bg-terracotta-700 text-white rounded-xl transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            <Send className="w-5 h-5" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
