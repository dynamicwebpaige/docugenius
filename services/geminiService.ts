import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_VISION } from '../constants';
import { BoundingBox, FieldType } from '../types';

interface DetectedField {
  box: BoundingBox;
  type: FieldType;
}

export const detectSignatures = async (base64Image: string): Promise<DetectedField[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    return [];
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Clean base64 string if it contains header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_VISION,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: `You are a document analysis AI. Your job is to find EVERY empty area on this page where a user is expected to write text, sign, or initial.

            Visual Cues to Detect:
            1.  **Horizontal Lines (_______)**: Any underline or solid line meant for writing.
                - **CRITICAL**: Look for "inline" lines inside paragraphs (e.g., "this ____ day of ____").
                - Look for signature lines at the bottom.
            2.  **Empty Boxes**: Rectangles for checkmarks or text entry.
            3.  **Whitespace Input Areas**: Empty space following labels like "Name:", "Title:", "Date:" if no line exists but input is implied.

            Classification ('type'):
            - "signature": ONLY for lines labeled "Signature", "By:", "Signed:".
            - "initial": Small lines/boxes labeled "Initial", "Initials", "Int.".
            - "text": Dates, names, titles, contract numbers, checkboxes, and fill-in-the-blanks within sentences.

            Exclusion Rules:
            - **IGNORE FILLED FIELDS**: If a line already has text written/typed on top of it, DO NOT detect it.
            - **IGNORE PAGE DIVIDERS**: Do not select long separation lines that are not for writing.

            Return JSON ONLY:
            { "fields": [{ "box": [ymin, xmin, ymax, xmax], "type": "text" }] }
            
            Coordinates must be normalized 0-1000.
            Be AGGRESSIVE. Detect even small inline blanks.`
          }
        ]
      }
    });

    const text = response.text || "";
    // Attempt to parse JSON. Sometimes models wrap in ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.fields && Array.isArray(parsed.fields)) {
        return parsed.fields
          .filter((item: any) => item.box && Array.isArray(item.box) && item.box.length >= 4)
          .map((item: any) => ({
            box: {
              ymin: item.box[0],
              xmin: item.box[1],
              ymax: item.box[2],
              xmax: item.box[3]
            },
            type: ['signature', 'initial', 'text'].includes(item.type) ? item.type : 'text'
          }));
      }
    }
    
    return [];
  } catch (error) {
    console.error("Gemini Detection Error:", error);
    return [];
  }
};