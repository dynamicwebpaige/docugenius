import React, { useState, useEffect } from 'react';
import { SIGNATURE_STYLES } from '../constants';
import { Button } from './Button';
import { Check, PenTool } from 'lucide-react';

interface SignatureCreatorProps {
  onComplete: (data: { signature: string; initials: string }) => void;
  initialName?: string;
}

export const SignatureCreator: React.FC<SignatureCreatorProps> = ({ onComplete, initialName = '' }) => {
  const [name, setName] = useState(initialName);
  const [selectedStyle, setSelectedStyle] = useState(SIGNATURE_STYLES[0].id);

  // Helper to generate the data URL for the signature
  const generateImage = (text: string, styleId: string, width: number = 600): string => {
    const style = SIGNATURE_STYLES.find(s => s.id === styleId);
    if (!style) return '';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Set dimensions
    canvas.width = width;
    canvas.height = 200;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Config font
    const fontFamilyMap: Record<string, string> = {
      'font-signature1': '"Great Vibes", cursive',
      'font-signature2': '"Dancing Script", cursive',
      'font-signature3': '"Herr Von Muellerhoff", cursive',
    };

    ctx.font = `100px ${fontFamilyMap[style.fontFamily] || 'sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black'; // Signature color

    // Draw text
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const signatureUrl = generateImage(name, selectedStyle, 600);
    const initialsUrl = generateImage(getInitials(name), selectedStyle, 300); // Smaller width for initials
    
    onComplete({
      signature: signatureUrl,
      initials: initialsUrl
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg text-primary">
          <PenTool size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Create your Signature</h2>
          <p className="text-sm text-gray-500">Type your name to generate signature and initials</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Doe"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
        />
      </div>

      {name.trim() && (
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Choose a Style</label>
          <div className="grid gap-4">
            {SIGNATURE_STYLES.map((style) => (
              <div 
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-center justify-between
                  ${selectedStyle === style.id ? 'border-primary bg-indigo-50/50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-4xl ${style.fontFamily} text-gray-800`}>
                    {name}
                  </div>
                  <div className={`text-2xl ${style.fontFamily} text-gray-500 border-l pl-4`}>
                    {getInitials(name)}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${selectedStyle === style.id ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                  {selectedStyle === style.id && <Check size={14} className="text-white" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-gray-100">
        <Button 
          disabled={!name.trim()} 
          onClick={handleCreate}
          className="w-full sm:w-auto"
        >
          Use this Signature
        </Button>
      </div>
    </div>
  );
};