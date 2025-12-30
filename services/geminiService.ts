import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractDataFromImage = async (base64Image: string, mimeType: string): Promise<ExtractedData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image containing a list of data (likely names and numbers in Persian/Arabic). 
            Extract the tabular data into a structured JSON format. 
            Return an object with two properties: 
            1. 'columns': an array of string headers. Use generic names like "col1", "col2" if headers aren't clear, but prefer inferred headers from the image text.
            2. 'rows': an array of arrays of strings. Each inner array represents a row of data, containing values strictly corresponding to the order of 'columns'.
            Ensure Persian/Arabic characters are preserved exactly.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                columns: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                rows: {
                    type: Type.ARRAY,
                    items: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    } 
                }
            },
            required: ["columns", "rows"]
        }
      },
    });

    const text = response.text;
    if (!text) {
        throw new Error("No data returned from Gemini");
    }

    const data = JSON.parse(text);
    const columns = data.columns || [];
    const rawRows = data.rows || [];
    
    // Post-process to convert array of arrays to array of objects for the app
    const rowsWithIds = rawRows.map((rowValues: any[], index: number) => {
        const rowObj: any = {
            id: `row-${Date.now()}-${index}`,
        };
        // Map values to column names
        columns.forEach((col: string, colIndex: number) => {
            if (rowValues[colIndex] !== undefined && rowValues[colIndex] !== null) {
                rowObj[col] = String(rowValues[colIndex]);
            } else {
                rowObj[col] = ""; // handle missing values
            }
        });
        return rowObj;
    });

    return {
        columns: columns,
        rows: rowsWithIds
    };

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Failed to extract data from image.");
  }
};