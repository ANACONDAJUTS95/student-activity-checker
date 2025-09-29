'use client'

import { ResultsContent } from "@/components/ResultsContent";
import { UploadContent } from "@/components/UploadContent";
import { useState } from "react";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('file');
  const [showResults, setShowResults] = useState(false);

  const handleCancel = () => {
    setSelectedFiles([]);
    setShowResults(false);
  };

  const handleNext = () => {
    if (selectedFiles.length > 0) {
      setShowResults(true);
    }
  };

  return (
    <div className="flex flex-col p-10 gap-10">
      {/* TABS */}
      <div className="flex flex-row items-start gap-10">
        <div 
          onClick={() => setActiveTab('file')}
          className={`flex items-center justify-center p-2 ${
            activeTab === 'file' ? 'border-b-2 border-black' : ''
          }`}
        >
          <h1 className={`text-md font-semibold ${
            activeTab === 'file' ? 'text-black' : 'text-black/40'
          } cursor-pointer hover:text-black ease transition-all duration-150`}>
            File
          </h1>
        </div>
        <div 
          onClick={() => setActiveTab('images')}
          className={`flex items-center justify-center p-2 ${
            activeTab === 'images' ? 'border-b-2 border-black' : ''
          }`}
        >
          <h1 className={`text-md font-semibold ${
            activeTab === 'images' ? 'text-black' : 'text-black/40'
          } cursor-pointer hover:text-black ease transition-all duration-150`}>
            Images
          </h1>
        </div>
      </div>
      {/* Upload Area */}
      {!showResults && (
        <>
          <UploadContent onFileSelect={setSelectedFiles} selectedFiles={selectedFiles} />
          {/* Buttons */}
          <div className="flex flex-row w-full items-center justify-end">
            <button 
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg cursor-pointer ease transition-all duration-150 text-black/40 hover:text-black"
            >
              Cancel
            </button>
            <button 
              onClick={handleNext}
              disabled={selectedFiles.length === 0}
              className={`px-4 py-2 text-white rounded-lg cursor-pointer ease transition-all duration-150 ml-5
                ${selectedFiles.length > 0
                  ? 'bg-[#0C8CE9] hover:bg-[#0A70BA]' 
                  : 'bg-[#0C8CE9]/50 cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        </>
      )}
      {/* Results Content */}
      {showResults && <ResultsContent />}
    </div>
  );
}
