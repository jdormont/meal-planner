import { X, Trash2, ShoppingCart } from 'lucide-react';
import { InstacartButton } from './InstacartButton';
import { useShoppingList } from '../contexts/ShoppingListContext';
import { useState } from 'react';

type ShoppingListDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ShoppingListDrawer({ isOpen, onClose }: ShoppingListDrawerProps) {
  const { items, removeItem, toggleItem, createInstacartLink, isLoading } = useShoppingList();
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  if (!isOpen) return null;

  const handleShopWithInstacart = async () => {
    setIsCreatingLink(true);
    const url = await createInstacartLink();
    setIsCreatingLink(false);
    if (url) {
      window.location.href = url; // Redirect to Instacart
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="flex-1 flex flex-col bg-white shadow-xl transform transition-transform animate-slide-in-right">
          
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-terracotta-600" />
              Shopping List
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading list...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">Your list is empty</p>
                <p className="text-sm">Add ingredients from recipes to get started.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg group">
                    <input 
                      type="checkbox"
                      checked={item.is_checked}
                      onChange={(e) => toggleItem(item.id, e.target.checked)}
                      className="w-5 h-5 text-terracotta-600 rounded border-gray-300 focus:ring-terracotta-500"
                    />
                    <div className={`flex-1 ${item.is_checked ? 'opacity-50 line-through' : ''}`}>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50">
            <InstacartButton
              text={isCreatingLink ? 'Building Cart...' : 'Shop with Instacart'}
              onClick={handleShopWithInstacart}
              disabled={items.filter(i => !i.is_checked).length === 0 || isCreatingLink}
              className="w-full"
            />
            <p className="text-xs text-center text-gray-500 mt-2">
              Powered by Instacart Connect
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
