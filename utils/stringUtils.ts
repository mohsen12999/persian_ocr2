import { NameDbItem, ExtractedData } from '../types';

// Levenshtein distance for fuzzy matching
export const getLevenshteinDistance = (a: string, b: string): number => {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
};

export const findClosestName = (input: string, db: NameDbItem[]): NameDbItem | null => {
  if (!input) return null;
  
  // Normalize input (remove extra spaces)
  const normalizedInput = input.trim();
  
  let bestMatch: NameDbItem | null = null;
  let minDistance = Infinity;

  for (const item of db) {
    const distance = getLevenshteinDistance(normalizedInput, item.name);
    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = item;
    }
  }

  return bestMatch;
};

export const sortNamesBySimilarity = (input: string, db: NameDbItem[]): NameDbItem[] => {
  const normalizedInput = input.trim();
  if (!normalizedInput) return db;

  return [...db].sort((a, b) => {
    const distA = getLevenshteinDistance(normalizedInput, a.name);
    const distB = getLevenshteinDistance(normalizedInput, b.name);
    return distA - distB;
  });
};

export const parseCSV = (text: string): ExtractedData => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return { columns: [], rows: [] };

  // Helper to split CSV line respecting quotes
  const splitLine = (line: string) => {
    const result = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuote && line[i+1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuote = !inQuote;
        }
      } else if (char === ',' && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  // Remove BOM if present
  let firstLine = lines[0];
  if (firstLine.charCodeAt(0) === 0xFEFF) {
    firstLine = firstLine.slice(1);
  }

  const columns = splitLine(firstLine);
  const rows = lines.slice(1).map((line, idx) => {
    const values = splitLine(line);
    const row: any = { id: `row-import-${Date.now()}-${idx}` };
    columns.forEach((col, i) => {
      row[col] = values[i] || '';
    });
    return row;
  });

  return { columns, rows };
};

export const toEnglishDigits = (str: string): string => {
    if (!str) return '';
    return str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
              .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};