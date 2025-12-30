import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import DataTable from './components/DataTable';
import DataEditor from './components/DataEditor';
import { ExtractedData, TableRow } from './types';
import { Layers } from 'lucide-react';

function App() {
  const [data, setData] = useState<ExtractedData | null>(null);
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  // Default to a placeholder number (like current year in Persian calendar + 0101)
  const [globalDate, setGlobalDate] = useState<string>('14030101'); 

  const handleDataExtracted = (extractedData: ExtractedData) => {
    setData(extractedData);
  };

  const handleRowSelect = (row: TableRow) => {
    setSelectedRow(row);
  };

  const handleCloseEditor = () => {
    setSelectedRow(null);
  };

  const handleReset = () => {
    setData(null);
    setSelectedRow(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Layers className="w-8 h-8 text-blue-600" />
              <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight">Persian Data Manager</span>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-xs text-gray-400 hidden sm:block">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {!data ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8 max-w-2xl">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Digitize Your Livestock Data</h1>
                <p className="text-lg text-gray-600">
                    Upload photos of handwritten or printed tables in Persian/Arabic. 
                    We'll extract the data, let you verify names, and sync it to your server.
                </p>
                <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm inline-block">
                    <p className="text-sm font-medium text-gray-500 mb-2">Or import existing data:</p>
                    <DataTable 
                        data={{columns: [], rows: []}} 
                        onSelectRow={() => {}} 
                        onReset={() => {}} 
                        onImport={handleDataExtracted} 
                    />
                </div>
            </div>
            <ImageUploader onDataExtracted={handleDataExtracted} />
          </div>
        ) : (
          <DataTable 
            data={data} 
            onSelectRow={handleRowSelect} 
            onReset={handleReset}
            onImport={handleDataExtracted}
          />
        )}

        {/* Editor Modal */}
        {selectedRow && data && (
          <DataEditor 
            row={selectedRow}
            columns={data.columns}
            globalDate={globalDate}
            onUpdateGlobalDate={setGlobalDate}
            onClose={handleCloseEditor}
          />
        )}
      </main>
    </div>
  );
}

export default App;
