import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to determine if key is mock
export const isMockKey = (key: string | undefined): boolean => {
  if (!key || key.trim() === '' || key === 'mock_key' || key.startsWith('mock_')) return true;
  return false;
};

// Safe JSON parser with try-repair logic
export const parseAndRepairJson = <T>(rawText: string, fallback: T): T => {
  const cleaned = rawText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.warn('JSON direct parse failed. Attempting cleanup/repair on text:', rawText);
    
    try {
      // Find the bounds of the JSON structure
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      
      let startIdx = -1;
      if (firstBrace !== -1 && firstBracket !== -1) {
        startIdx = Math.min(firstBrace, firstBracket);
      } else if (firstBrace !== -1) {
        startIdx = firstBrace;
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
      }

      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');
      const endIdx = Math.max(lastBrace, lastBracket);

      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const extracted = cleaned.substring(startIdx, endIdx + 1);
        
        // Remove trailing commas before closing braces/brackets and sanitize linebreaks
        const fixedCommas = extracted
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/\\n/g, ' ')
          .replace(/\n/g, ' ');
          
        return JSON.parse(fixedCommas) as T;
      }
    } catch (repairErr) {
      console.error('JSON repair failed:', repairErr);
    }
    
    return fallback;
  }
};

// Central Generative AI client wrapper
export const getGeminiModel = (apiKey: string | undefined) => {
  if (isMockKey(apiKey)) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(apiKey!);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};
