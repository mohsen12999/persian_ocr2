import React, { useState, useEffect, useMemo } from 'react';
import { TableRow, ColumnType, ColumnMapping, NameDbItem, ApiPayload } from '../types';
import { MOCK_NAMES_DB, API_URL } from '../constants';
import { sortNamesBySimilarity, toEnglishDigits } from '../utils/stringUtils';
import { X, Send, Save, Check, AlertCircle } from 'lucide-react';

interface DataEditorProps {
  row: TableRow;
  columns: string[];
  globalDate: string;
  onClose: () => void;
  onUpdateGlobalDate: (date: string) => void;
}

const DataEditor: React.FC<DataEditorProps> = ({ row, columns, globalDate, onClose, onUpdateGlobalDate }) => {
  const [mappings, setMappings] = useState<Record<string, ColumnType>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedNameId, setSelectedNameId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  // Initialize mappings and form data on load
  useEffect(() => {
    const initMappings: Record<string, ColumnType> = {};
    const initData: Record<string, any> = {};

    columns.forEach((col, idx) => {
      // Heuristic: guess type based on content
      const val = String(row[col]);
      let type = ColumnType.NONE;
      
      // Simple guessing logic
      if (isNaN(Number(val)) && val.length > 2) type = ColumnType.NAME;
      else if (!isNaN(Number(val))) type = ColumnType.SHEEP; // Default numeric to sheep, user can change
      
      initMappings[col] = type;
      initData[col] = val;
    });

    setMappings(initMappings);
    setFormData(initData);
  }, [row, columns]);

  const handleMappingChange = (col: string, type: ColumnType) => {
    setMappings(prev => ({ ...prev, [col]: type }));
    // No specific reset logic needed here as handleValueChange handles validation state
  };

  const handleValueChange = (col: string, val: string) => {
    setFormData(prev => ({ ...prev, [col]: val }));
    
    // If we are editing the text of a column mapped to NAME manually, 
    // we must reset the selected ID because the text might no longer match the previous selection.
    if (mappings[col] === ColumnType.NAME) {
        setSelectedNameId(null);
    }
  };

  const handleSubmit = async () => {
    setIsSending(true);
    setApiResponse(null);

    try {
        // 1. Validation
        if (!globalDate || globalDate.trim() === '') {
            throw new Error("Date is required.");
        }
        
        // Sanitize Date
        const cleanDate = toEnglishDigits(globalDate.trim());
        if (isNaN(Number(cleanDate))) {
            throw new Error("Date must be a numeric value (e.g., 14030101).");
        }

        // Construct Payload
        // The requirement is: "send data from form with type that choose in combo box and value from inbox"
        const mappedData: Record<string, any> = {};
        let hasActiveMappings = false;
        
        // Process fields based on mapping
        for (const col of columns) {
            const type = mappings[col];
            const value = formData[col];

            if (type === ColumnType.NONE) continue;
            hasActiveMappings = true;

            if (type === ColumnType.NAME) {
                // Name Handling: Send ID from list that was chosen
                let finalId = selectedNameId;
                
                // Fallback: If ID is not set (e.g. user typed manually exact match), try to find exact match
                if (!finalId && value) {
                    const normalizedVal = String(value).trim();
                    const match = MOCK_NAMES_DB.find(item => item.name === normalizedVal);
                    if (match) {
                        finalId = match.id;
                    }
                }
                
                // Set the value for the 'name' key to the ID
                mappedData[type] = finalId;
            } else {
                // Numeric fields (cow, sheep, goat)
                // Get value from inbox (input box)
                const rawVal = String(value || '').trim();
                
                // Convert Persian digits to English
                let cleanVal = toEnglishDigits(rawVal);
                
                // Remove commas (English , and Persian ،), spaces, and ensure only digits/dots/minus remain
                // This handles cases like "۱,۲۰۰" or " 12 " or "12 cows" (strips text)
                cleanVal = cleanVal.replace(/[,،\s]/g, '');

                // Aggressive check: if it's still NaN, stripping non-numeric chars might help 
                // but let's first check if the basic clean worked.
                let numVal = 0;
                
                if (cleanVal !== '') {
                     if (!isNaN(Number(cleanVal))) {
                         numVal = Number(cleanVal);
                     } else {
                         // Fallback: Remove all non-numeric characters (except . and -)
                         // This catches hidden chars or text mixed with numbers
                         const aggressiveClean = cleanVal.replace(/[^0-9.-]/g, '');
                         if (aggressiveClean !== '' && !isNaN(Number(aggressiveClean))) {
                             numVal = Number(aggressiveClean);
                         } else {
                             throw new Error(`Value for '${col}' must be a valid number.`);
                         }
                     }
                }
                
                // Set the value for the type key (e.g. mappedData['cow'] = 5)
                mappedData[type] = numVal;
            }
        }

        if (!hasActiveMappings) {
            throw new Error("Please map at least one column before sending.");
        }

        const payload: ApiPayload = {
            date: cleanDate, 
            mappedData,
            rawRowData: row
        };

        console.log("Sending Payload to " + API_URL, payload);

        // 2. Mock API Call 
        /*
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             throw new Error(errorData.message || `Server Error: ${response.status}`);
        }
        */
        
        // Mock delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setApiResponse("Success! Data transmitted to server.");
    } catch (e: any) {
        console.error("Submission Error:", e);
        let msg = "An unexpected error occurred.";
        if (e instanceof Error) {
            msg = e.message;
        } else if (typeof e === 'string') {
            msg = e;
        }
        setApiResponse(msg);
    } finally {
        setIsSending(false);
    }
  };

  // Helper to render input for a specific column based on its mapped type
  const renderField = (col: string) => {
    const type = mappings[col];
    const value = formData[col] || '';

    if (type === ColumnType.NONE) return null;

    if (type === ColumnType.NAME) {
        // Get suggestions sorted by similarity
        const suggestions = sortNamesBySimilarity(String(value), MOCK_NAMES_DB).slice(0, 5);

        return (
            <div className="mt-2 space-y-2">
                <label className="text-xs text-gray-500">Edit Text (Search)</label>
                <input 
                    type="text" 
                    value={value} 
                    onChange={(e) => handleValueChange(col, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-right"
                    placeholder="Start typing to search..."
                />
                <div className="bg-gray-50 p-2 rounded border border-gray-200 max-h-40 overflow-y-auto">
                    <p className="text-xs text-gray-400 mb-1">Suggested Matches (Click to Select):</p>
                    {suggestions.map(s => (
                        <div 
                            key={s.id}
                            onClick={() => {
                                // Update text in inbox
                                setFormData(prev => ({ ...prev, [col]: s.name }));
                                // Set ID for payload
                                setSelectedNameId(s.id);
                            }}
                            className={`flex justify-between items-center p-2 rounded cursor-pointer text-sm ${selectedNameId === s.id ? 'bg-blue-100 text-blue-800 border-blue-200 border' : 'hover:bg-gray-100'}`}
                        >
                            <span>{s.name}</span>
                            <span className="text-xs text-gray-400">#{s.id}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Number inputs for livestock
    return (
        <div className="mt-2">
            <label className="text-xs text-gray-500">Value</label>
            <input 
                type="text" 
                inputMode="decimal"
                value={value} 
                onChange={(e) => handleValueChange(col, e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-right"
            />
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
           <h3 className="text-xl font-bold text-gray-800">Edit Row Data</h3>
           <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
             <X className="w-6 h-6 text-gray-500" />
           </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Global Date Field */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-semibold text-blue-800 mb-1">Transaction Date (Numeric)</label>
                <input 
                    type="number" 
                    value={globalDate} 
                    onChange={(e) => onUpdateGlobalDate(e.target.value)}
                    placeholder="e.g. 14030101"
                    className="w-full p-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Dynamic Column Mapping */}
            <div className="space-y-4">
                {columns.map((col, idx) => (
                    <div key={idx} className="border p-4 rounded-lg bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-700">{col} (Original: {row[col]})</span>
                            <select 
                                value={mappings[col] || ColumnType.NONE}
                                onChange={(e) => handleMappingChange(col, e.target.value as ColumnType)}
                                className="border border-gray-300 rounded p-1 text-sm bg-gray-50"
                            >
                                <option value={ColumnType.NONE}>Ignore</option>
                                <option value={ColumnType.NAME}>Name (Person)</option>
                                <option value={ColumnType.COW}>Cow</option>
                                <option value={ColumnType.SHEEP}>Sheep</option>
                                <option value={ColumnType.GOAT}>Goat</option>
                            </select>
                        </div>
                        {renderField(col)}
                    </div>
                ))}
            </div>

            {apiResponse && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${apiResponse.includes("Success") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {apiResponse.includes("Success") ? <Check className="w-5 h-5"/> : <AlertCircle className="w-5 h-5"/>}
                    {apiResponse}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition"
           >
             Cancel
           </button>
           <button 
             onClick={handleSubmit}
             disabled={isSending}
             className={`px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition flex items-center gap-2 ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
           >
             {isSending ? 'Sending...' : 'Send to Server'}
             <Send className="w-4 h-4" />
           </button>
        </div>

      </div>
    </div>
  );
};

export default DataEditor;