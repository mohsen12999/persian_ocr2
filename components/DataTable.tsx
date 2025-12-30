import React, { useRef } from 'react';
import { ExtractedData, TableRow } from '../types';
import { parseCSV } from '../utils/stringUtils';
import { Download, Save, RefreshCw, Edit, Upload } from 'lucide-react';

interface DataTableProps {
  data: ExtractedData;
  onSelectRow: (row: TableRow) => void;
  onReset: () => void;
  onImport: (data: ExtractedData) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, onSelectRow, onReset, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExportCSV = () => {
    if (!data || data.rows.length === 0) return;

    // Add BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const headers = data.columns.join(",");
    const rows = data.rows.map(row => 
      data.columns.map(col => {
        // Escape quotes if needed
        const val = String(row[col] || '');
        return `"${val.replace(/"/g, '""')}"`;
      }).join(",")
    ).join("\n");

    const csvContent = BOM + headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `extracted_data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const importedData = parseCSV(text);
        onImport(importedData);
      } catch (err) {
        alert("Failed to parse CSV file");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
            Extracted Data
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{data.rows.length} rows</span>
        </h2>
        <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <button 
                onClick={handleImportClick}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                <Upload className="w-4 h-4" />
                Import CSV
            </button>
            <button 
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
                <RefreshCw className="w-4 h-4" />
                New Upload
            </button>
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm"
            >
                <Download className="w-4 h-4" />
                Export CSV
            </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
        <table className="w-full text-sm text-left text-gray-500" dir="rtl">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th scope="col" className="px-6 py-3 text-right">Action</th>
              {data.columns.map((col, idx) => (
                <th key={idx} scope="col" className="px-6 py-3 text-right font-bold tracking-wider">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-right w-24">
                   <button 
                     onClick={() => onSelectRow(row)}
                     className="text-blue-600 hover:text-blue-900 flex items-center gap-1 font-medium"
                   >
                     <Edit className="w-4 h-4" />
                     Process
                   </button>
                </td>
                {data.columns.map((col, idx) => (
                  <td key={idx} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap text-right">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-gray-400 text-center">
          Verify data accuracy before exporting or processing. Click 'Process' to edit a specific row.
      </p>
    </div>
  );
};

export default DataTable;
