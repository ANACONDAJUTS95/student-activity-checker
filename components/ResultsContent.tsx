import { useState, useEffect } from 'react';
import { parseRubrics, scoreFile } from '@/utils/scoring';

interface ResultsContentProps {
  scoringInstructions: string;
  totalScore: number;
  files: File[];
  onProcessingStateChange?: (isProcessing: boolean) => void;
}

interface FileScore {
  fileName: string;
  totalScore: number;
  rubricScores: {
    category: string;
    score: number;
    maxPoints: number;
    feedback: string;
  }[];
  error?: string;
}

export function ResultsContent({ scoringInstructions, totalScore, files, onProcessingStateChange }: ResultsContentProps) {
  const [fileScores, setFileScores] = useState<FileScore[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [parsedRubrics, setParsedRubrics] = useState<any[]>([]);

  // Notify parent component of processing state changes
  useEffect(() => {
    onProcessingStateChange?.(isProcessing);
  }, [isProcessing, onProcessingStateChange]);

  useEffect(() => {
    const processFileWithRetry = async (file: File, rubrics: any[], retries = 2): Promise<FileScore> => {
      try {
        return await scoreFile(file, rubrics);
      } catch (error) {
        if (retries > 0 && error instanceof Error && error.message.includes('NetworkError')) {
          // Wait for 2 seconds before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
          return processFileWithRetry(file, rubrics, retries - 1);
        }
        return {
          fileName: file.name,
          totalScore: 0,
          rubricScores: [],
          error: error instanceof Error ? error.message : 'Failed to process file'
        };
      }
    };

    const processFiles = async () => {
      try {
        setIsProcessing(true);
        setFileScores([]); // Reset scores at the start
        const rubrics = parseRubrics(scoringInstructions);
        setParsedRubrics(rubrics); // Store parsed rubrics for display
        
        // If no rubrics were parsed, show error
        if (rubrics.length === 0) {
          console.error('No rubrics could be parsed from the instructions');
        }
        
        const results: FileScore[] = [];

        // Process files sequentially with delays between each
        for (let i = 0; i < files.length; i++) {
          // Update progress and current file
          const currentProgress = Math.round(((i) / files.length) * 100);
          setProgress(currentProgress);
          setCurrentFile(files[i].name);
          
          // Process file with retry mechanism
          const result = await processFileWithRetry(files[i], rubrics);
          results.push(result);
          
          // Add delay between files
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        // Set final progress
        setProgress(100);

        // Set all scores at once after all files are processed
        setFileScores(results);
      } catch (error) {
        console.error('Error processing files:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    if (files.length > 0) {
      processFiles();
    }
  }, [files, scoringInstructions]);

  return (
    <div className="flex flex-col w-full gap-6">
      <h1 className="text-2xl font-semibold text-black">Results</h1>
      
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium text-black">Scoring Instructions</h2>
        <div className="p-4 bg-gray-50 rounded-lg">
          <pre className="whitespace-pre-wrap">{scoringInstructions}</pre>
        </div>
        <p className="text-black/70">Total Possible Score: {totalScore}</p>
        
        {/* Show parsed rubrics */}
        {parsedRubrics.length > 0 ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-black mb-2">Parsed Rubric Categories ({parsedRubrics.length}):</h3>
            <ul className="list-disc list-inside space-y-1">
              {parsedRubrics.map((rubric, idx) => (
                <li key={idx} className="text-sm text-black/70">
                  <span className="font-medium">{rubric.category}</span> ({rubric.points} points)
                </li>
              ))}
            </ul>
          </div>
        ) : !isProcessing && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="font-medium text-red-700 mb-2">⚠️ No Rubrics Detected</h3>
            <p className="text-sm text-red-600">
              Please format your rubrics using one of these patterns:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-red-600">
              <li>Category (X points) - Description</li>
              <li>• Category (X points) - Description</li>
              <li>Category (X pts): Description</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium text-black">Scored Files</h2>
        <div className="flex flex-col items-center justify-center w-full p-6 border-2 rounded-lg border-black/20 gap-5 bg-[#DFE8FF]/40">
          {isProcessing ? (
            <div className="w-full p-4 bg-white border border-black/20 rounded-lg shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#0C8CE9] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-black/70">Processing files...</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-[#0C8CE9] h-2.5 rounded-full transition-all duration-300 ease-in-out"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-black/60">
                    <span>{currentFile}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            fileScores.map((result, index) => {
              const hasAIWarning = result.rubricScores.some(score => 
                score.feedback.includes('⚠️') || score.feedback.includes('AI')
              );
              const scorePercentage = totalScore > 0 ? (result.totalScore / totalScore) * 100 : 0;
              
              return (
                <div key={index} className={`w-full p-4 bg-white rounded-lg shadow-sm ${
                  hasAIWarning ? 'border-2 border-orange-300' : 'border border-black/20'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-black">{result.fileName}</h3>
                      {hasAIWarning && (
                        <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                          <span>⚠️</span>
                          <span className="font-medium">AI Detection Alert</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold text-lg ${
                        scorePercentage >= 90 ? 'text-green-600' :
                        scorePercentage >= 75 ? 'text-[#0C8CE9]' :
                        scorePercentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {result.totalScore}
                      </span>
                      <span className="text-black/40">/{totalScore}</span>
                      <div className="text-xs text-black/50 mt-1">
                        {scorePercentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {result.error ? (
                    <p className="text-red-500">{result.error}</p>
                  ) : (
                    <div className="space-y-3">
                      {result.rubricScores.map((score, idx) => {
                        const scorePercent = score.maxPoints > 0 ? (score.score / score.maxPoints) * 100 : 0;
                        return (
                          <div key={idx} className="border-b border-black/10 pb-2 last:border-b-0">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-black">{score.category}</span>
                              <span className={`font-semibold ${
                                scorePercent >= 90 ? 'text-green-600' :
                                scorePercent >= 75 ? 'text-blue-600' :
                                scorePercent >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {score.score}/{score.maxPoints}
                              </span>
                            </div>
                            <p className={`text-sm mt-1 ${
                              score.feedback.includes('⚠️') ? 'text-orange-600 font-medium' : 'text-black/60'
                            }`}>
                              {score.feedback}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
