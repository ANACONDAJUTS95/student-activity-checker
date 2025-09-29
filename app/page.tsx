'use client'

import { ResultsContent } from "@/components/ResultsContent";
import { ScoringInstructions } from "@/components/ScoringInstructions";
import { UploadContent } from "@/components/UploadContent";
import { useState, useEffect } from "react";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState('file');
  const [showResults, setShowResults] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [scoringInstructions, setScoringInstructions] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [isGeneratingScores, setIsGeneratingScores] = useState(false);
  const [dotCount, setDotCount] = useState(1);

  const handleCancel = () => {
    setSelectedFiles([]);
    setShowResults(false);
    setShowScoring(false);
    setScoringInstructions('');
    setTotalScore(0);
  };

  const handleNext = () => {
    if (selectedFiles.length > 0) {
      setShowScoring(true);
    }
  };

  const handleBack = () => {
    setShowScoring(false);
  };

  // Effect for the loading animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGeneratingScores) {
      interval = setInterval(() => {
        setDotCount((prev) => (prev % 3) + 1);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isGeneratingScores]);

  const handleScoringSubmit = async (instructions: string, score: number) => {
    setScoringInstructions(instructions);
    setTotalScore(score);
    setShowResults(true);
  };

  const handleNewBatch = () => {
    // Refresh the page
    window.location.reload();
  };

  return (
    <div className="flex flex-col p-10 gap-10">
      {/* Header with action buttons */}
      <div className="flex flex-row items-center justify-between w-full">
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
      </div>
      {/* Upload Area */}
      {!showResults && !showScoring && (
        <UploadContent 
          onFileSelect={setSelectedFiles} 
          selectedFiles={selectedFiles}
          mode={activeTab as 'file' | 'images'} 
        />
      )}
      {/* Scoring Instructions */}
      {!showResults && showScoring && (
        <ScoringInstructions onSubmit={handleScoringSubmit} onBack={handleBack} />
      )}
      {/* Results Content */}
      {showResults && (
        <ResultsContent 
          scoringInstructions={scoringInstructions} 
          totalScore={totalScore} 
          files={selectedFiles}
          onProcessingStateChange={setIsGeneratingScores}
        />
      )}

      {/* Bottom Action Buttons */}
      <div className="flex flex-row w-full items-center justify-end">
        {!showResults && !showScoring && (
          <>
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
          </>
        )}
        {showResults && (
          <>
            <button 
              onClick={handleNewBatch}
              className="px-4 py-2 rounded-lg cursor-pointer ease transition-all duration-150 text-black/40 hover:text-black"
            >
              Score a New Batch
            </button>
            <div className="px-4 py-2 rounded-lg bg-[#24CB71]/10 text-[#24CB71] font-medium ml-5">
              {isGeneratingScores 
                ? `Scores generating${'.'.repeat(dotCount)}`
                : 'Scores Generated'
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
