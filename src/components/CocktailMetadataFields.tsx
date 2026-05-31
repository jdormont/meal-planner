import { CocktailMetadata } from '../lib/supabase';

type CocktailMetadataFieldsProps = {
  metadata: CocktailMetadata;
  onChange: (metadata: CocktailMetadata) => void;
};

export function CocktailMetadataFields({ metadata, onChange }: CocktailMetadataFieldsProps) {
  const updateField = (field: keyof CocktailMetadata, value: string) => {
    onChange({
      ...metadata,
      [field]: value
    });
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Cocktail Details</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Base Spirit
          </label>
          <select
            value={metadata.spiritBase || ''}
            onChange={(e) => updateField('spiritBase', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Select...</option>
            <option value="vodka">Vodka</option>
            <option value="gin">Gin</option>
            <option value="rum">Rum</option>
            <option value="tequila">Tequila</option>
            <option value="whiskey">Whiskey</option>
            <option value="bourbon">Bourbon</option>
            <option value="brandy">Brandy</option>
            <option value="mezcal">Mezcal</option>
            <option value="non-alcoholic">Non-Alcoholic</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Glass Type
          </label>
          <select
            value={metadata.glassType || ''}
            onChange={(e) => updateField('glassType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Select...</option>
            <option value="rocks">Rocks/Old Fashioned</option>
            <option value="highball">Highball</option>
            <option value="martini">Martini</option>
            <option value="coupe">Coupe</option>
            <option value="collins">Collins</option>
            <option value="hurricane">Hurricane</option>
            <option value="champagne">Champagne Flute</option>
            <option value="shot">Shot Glass</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Method
          </label>
          <select
            value={metadata.method || ''}
            onChange={(e) => updateField('method', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Select...</option>
            <option value="shaken">Shaken</option>
            <option value="stirred">Stirred</option>
            <option value="built">Built</option>
            <option value="blended">Blended</option>
            <option value="muddled">Muddled</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Ice
          </label>
          <select
            value={metadata.ice || ''}
            onChange={(e) => updateField('ice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm bg-white"
          >
            <option value="">Select...</option>
            <option value="cubed">Cubed</option>
            <option value="crushed">Crushed</option>
            <option value="neat">Neat (No Ice)</option>
            <option value="rocks">On the Rocks</option>
            <option value="large-cube">Large Cube</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Garnish
          </label>
          <input
            type="text"
            value={metadata.garnish || ''}
            onChange={(e) => updateField('garnish', e.target.value)}
            placeholder="e.g., lemon twist, cherry, mint sprig"
            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-500 focus:border-transparent outline-none text-sm bg-white"
          />
        </div>
      </div>
    </div>
  );
}
