import { useState } from 'react';

interface ScoringInstructionsProps {
  onSubmit: (instructions: string, totalScore: number) => void;
  onBack: () => void;
}

export function ScoringInstructions({ onSubmit, onBack }: ScoringInstructionsProps) {
  const [instructions, setInstructions] = useState('');
  const [totalScore, setTotalScore] = useState<number>(0);

  const handleSubmit = () => {
    if (instructions && totalScore > 0) {
      onSubmit(instructions, totalScore);
    }
  };

  return (
    <div className="flex flex-col w-full gap-6">
      <h1 className="text-2xl font-semibold text-black">Step 2. Generate Scoring Instructions</h1>
      
      <div className="flex flex-col gap-4">
        <label className="font-medium text-black">Rubrics</label>
        <textarea 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Enter detailed scoring instructions and rubrics here..."
          className="w-full h-[200px] p-4 border border-black/20 rounded-lg focus:outline-none focus:border-[#0C8CE9] resize-none text-black"
        />
      </div>

      <div className="flex flex-row gap-4 items-center">
        <label className="font-medium text-black">Total Score</label>
        <input 
          type="number"
          value={totalScore}
          onChange={(e) => setTotalScore(Math.max(0, parseInt(e.target.value) || 0))}
          className="w-[200px] p-2 border border-black/20 rounded-lg focus:outline-none focus:border-[#0C8CE9] text-black"
          min="0"
        />
      </div>

      <div className="flex flex-row w-full items-center justify-end gap-4">
        <button 
          onClick={onBack}
          className="px-4 py-2 rounded-lg cursor-pointer ease transition-all duration-150 text-black/40 hover:text-black"
        >
          Back
        </button>
        <button 
          onClick={handleSubmit}
          disabled={!instructions || totalScore <= 0}
          className={`px-4 py-2 text-white rounded-lg cursor-pointer ease transition-all duration-150
            ${instructions && totalScore > 0
              ? 'bg-[#0C8CE9] hover:bg-[#0A70BA]' 
              : 'bg-[#0C8CE9]/50 cursor-not-allowed'}`}
        >
          Generate Scores
        </button>
      </div>
    </div>
  );
}