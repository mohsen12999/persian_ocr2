import React, { useState, useRef } from 'react';
import { Upload, Loader2, FileImage } from 'lucide-react';
import { extractDataFromImage } from '../services/geminiService';
import { ExtractedData } from '../types';

interface ImageUploaderProps {
  onDataExtracted: (data: ExtractedData) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onDataExtracted }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = (e.target?.result as string).split(',')[1];
        try {
            const result = await extractDataFromImage(base64String, file.type);
            onDataExtracted(result);
        } catch (err) {
            setError("Failed to process image with AI. Please try again.");
        } finally {
            setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Data Image</h2>
        <p className="text-gray-500 text-sm">Upload an image containing tables of names and counts (Persian/Arabic).</p>
      </div>

      <div 
        className={`relative border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer
            ${isLoading ? 'bg-gray-50 border-gray-300' : 'border-blue-300 hover:bg-blue-50 hover:border-blue-400'}`}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
            disabled={isLoading}
        />

        {isLoading ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Analyzing with Gemini AI...</p>
            <p className="text-xs text-gray-400 mt-1">Extracting Persian text & numbers</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-blue-100 rounded-full mb-4">
                <FileImage className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-lg font-semibold text-gray-700">Click to upload image</p>
            <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, WEBP</p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
