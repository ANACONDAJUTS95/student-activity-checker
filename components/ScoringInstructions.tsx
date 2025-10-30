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
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
          <p className="font-medium text-black mb-1">Format each rubric on a new line:</p>
          <p className="text-black/70">• Category Name (points) - Description</p>
          <p className="text-black/60 text-xs mt-2">Example:</p>
          <p className="text-black/60 text-xs">Thesis Statement (10 points) - Clear and arguable thesis</p>
          <p className="text-black/60 text-xs">Evidence (15 pts): Supporting facts and examples</p>
        </div>
        <textarea 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="• Thesis Statement (10 points) - Clear and arguable thesis&#10;• Evidence (15 points) - Supporting facts and examples&#10;• Organization (10 points) - Logical structure and flow&#10;• Grammar (10 points) - Proper spelling and grammar&#10;• Conclusion (5 points) - Effective summary"
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