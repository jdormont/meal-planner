import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Save, MessageSquare, Trash2, Plus } from 'lucide-react';
import { marked } from 'marked';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type AIChatProps = {
  onSaveRecipe?: (recipeText: string) => void;
};

type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function AIChat({ onSaveRecipe }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI cooking assistant. I can help you discover new recipes, suggest ingredient substitutions, plan meals, and answer cooking questions. What would you like to cook today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
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
    }
  }, [user]);

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
    }
  };

  const createNewChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your AI cooking assistant. I can help you discover new recipes, suggest ingredient substitutions, plan meals, and answer cooking questions. What would you like to cook today?",
      },
    ]);
    setCurrentChatId(null);
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMessage = { role: 'user' as const, content: userMessage };
    setMessages((prev) => [...prev, newUserMessage]);
    setLoading(true);

    if (currentChatId) {
      await saveNewMessage(newUserMessage);
    }

    try {
      let ratingHistory = [];
      let userPreferences = null;

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
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
            apiKey: import.meta.env.VITE_OPENAI_API_KEY,
            ratingHistory,
            userPreferences,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.message };
      setMessages((prev) => [...prev, assistantMessage]);

      if (currentChatId) {
        await saveNewMessage(assistantMessage);
      } else {
        await saveCurrentChat();
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

  return (
    <div className="flex h-full bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b bg-gradient-to-r from-orange-600 to-amber-600">
          <button
            onClick={createNewChat}
            className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-orange-600 rounded-lg transition flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition group hover:bg-gray-50 ${
                currentChatId === chat.id ? 'bg-orange-50 border border-orange-200' : ''
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
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI Cooking Assistant</h2>
              <p className="text-sm text-orange-100">Ask me anything about recipes and cooking</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-orange-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-900'
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
                  onClick={() => onSaveRecipe(message.content.replace('FULL_RECIPE', '').trim())}
                  className="mt-3 px-3 py-1.5 bg-white hover:bg-gray-50 text-orange-600 rounded-lg text-sm font-medium flex items-center gap-2 transition"
                >
                  <Save className="w-4 h-4" />
                  Save as Recipe
                </button>
              )}
            </div>
            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-orange-600" />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          </div>
        )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me for recipe ideas, cooking tips, or substitutions..."
            rows={2}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-6 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
