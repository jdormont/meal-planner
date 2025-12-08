import { useState, useRef } from 'react';
import { X, Camera, Upload, Loader, CheckCircle, AlertCircle, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Recipe } from '../lib/supabase';

type ImportStatus = 'idle' | 'processing' | 'done' | 'error';

type RecipePhotoModalProps = {
  onClose: () => void;
  onImportComplete: (recipe: Partial<Recipe>) => void;
};

export function RecipePhotoModal({ onClose, onImportComplete }: RecipePhotoModalProps) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const maxDimension = 2048;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve(reader.result as string);
              };
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    try {
      setError(null);
      const compressed = await compressImage(file);
      setImageData(compressed);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleExtractRecipe = async () => {
    if (!imageData) return;

    try {
      setStatus('processing');
      setError(null);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe-from-image`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract recipe from image');
      }

      const recipe = await response.json();

      const recipeWithDefaults = {
        ...recipe,
        notes: `Extracted from photo${recipe.confidence ? ` (confidence: ${recipe.confidence})` : ''}`,
        is_shared: false,
      };

      setStatus('done');

      setTimeout(() => {
        onImportComplete(recipeWithDefaults);
        onClose();
      }, 1000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to extract recipe from image');
    }
  };

  const handleRetake = () => {
    setImageData(null);
    setStatus('idle');
    setError(null);
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'processing':
        return 'Analyzing image and extracting recipe...';
      case 'done':
        return 'Recipe extracted successfully!';
      case 'error':
        return error || 'Failed to extract recipe from image';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'done':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Camera className="w-6 h-6 text-orange-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Camera className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import from Photo</h2>
              <p className="text-sm text-gray-600">Capture or upload a recipe image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            disabled={status === 'processing'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!imageData ? (
            <>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What can you capture?</h3>
                  <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>Restaurant menu items with descriptions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>Plated dishes to identify and create recipes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>Recipe cards or screenshots</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>Handwritten recipes</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <Camera className="w-12 h-12 text-gray-400 group-hover:text-orange-600 mb-3 transition" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition">
                    Take Photo
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Use camera</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all group"
                >
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-orange-600 mb-3 transition" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition">
                    Upload Image
                  </span>
                  <span className="text-xs text-gray-500 mt-1">From gallery or files</span>
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> For best results, ensure the image is clear, well-lit, and text is readable.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={imageData}
                    alt="Recipe to extract"
                    className="w-full h-auto max-h-96 object-contain bg-gray-50"
                  />
                </div>

                {status === 'idle' && (
                  <button
                    onClick={handleRetake}
                    className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Choose Different Image
                  </button>
                )}
              </div>

              {status !== 'idle' && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  status === 'error' ? 'bg-red-50' :
                  status === 'done' ? 'bg-green-50' :
                  'bg-blue-50'
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon()}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      status === 'error' ? 'text-red-800' :
                      status === 'done' ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      {getStatusMessage()}
                    </p>
                    {status === 'processing' && (
                      <p className="text-xs text-blue-600 mt-1">This may take a few moments...</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            disabled={status === 'processing'}
          >
            Cancel
          </button>
          {imageData && (
            <button
              onClick={handleExtractRecipe}
              disabled={status === 'processing' || status === 'done'}
              className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'processing' ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Extract Recipe
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
