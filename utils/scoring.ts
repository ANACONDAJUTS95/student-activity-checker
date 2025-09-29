import mammoth from 'mammoth';
import { getDocument } from 'pdfjs-dist';
import { setupPdfWorker } from './pdfjs-init';

// Initialize PDF.js worker
setupPdfWorker();

interface RubricItem {
  category: string;
  points: number;
  description: string;
}

interface ScoringResult {
  fileName: string;
  totalScore: number;
  rubricScores: {
    category: string;
    score: number;
    maxPoints: number;
    feedback: string;
  }[];
}

export function parseRubrics(instructions: string): RubricItem[] {
  const rubrics: RubricItem[] = [];
  const lines = instructions.split('\n');

  for (const line of lines) {
    // Match the pattern: "• Category (X points) - Description"
    const match = line.match(/^•?\s*([^(]+)\s*\((\d+)\s*points?\)\s*-\s*(.+)$/i);
    if (match) {
      rubrics.push({
        category: match[1].trim(),
        points: parseInt(match[2], 10),
        description: match[3].trim()
      });
    }
  }

  return rubrics;
}

async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const fileType = file.name.toLowerCase().split('.').pop();

  if (fileType === 'pdf') {
    try {
      if (typeof window === 'undefined') {
        throw new Error('PDF processing is only available in browser environment');
      }
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      
      return text.trim();
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  } else if (fileType === 'docx') {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  } else if (fileType === 'doc') {
    throw new Error('Legacy .doc files are not supported. Please convert to .docx format.');
  }

  throw new Error('Unsupported file type');
}

function calculateScore(text: string, rubricItem: RubricItem): {
  score: number;
  feedback: string;
} {
  const { description, points } = rubricItem;
  const keywords = description.toLowerCase().split(' ');
  const contentWords = text.toLowerCase().split(' ');
  
  // Calculate keyword matches
  const matches = keywords.filter(keyword => 
    contentWords.some(word => word.includes(keyword))
  ).length;
  
  // Calculate score based on keyword matches with a minimum of 75%
  const matchRatio = matches / keywords.length;
  // Adjust the ratio to start from 0.75 (75%) and go up to 1.0 (100%)
  const adjustedRatio = 0.75 + (matchRatio * 0.25);
  const score = Math.round(points * adjustedRatio);
  
  // Generate feedback
  let feedback = '';
  if (matchRatio >= 0.8) {
    feedback = 'Excellent match with criteria';
  } else if (matchRatio >= 0.6) {
    feedback = 'Good match with most criteria';
  } else if (matchRatio >= 0.4) {
    feedback = 'Partially meets criteria';
  } else {
    feedback = 'Limited match with criteria';
  }
  
  return { score, feedback };
}

export async function scoreFile(
  file: File,
  rubrics: RubricItem[]
): Promise<ScoringResult> {
  try {
    const fileType = file.name.toLowerCase().split('.').pop();
    const isImage = ['jpg', 'jpeg', 'png'].includes(fileType || '');

    let rubricScores;
    if (isImage) {
      const { scoreImage } = await import('./imageProcessing');
      rubricScores = await scoreImage(file, rubrics);
    } else {
      const content = await extractTextFromFile(file);
      rubricScores = rubrics.map(rubric => {
        const { score, feedback } = calculateScore(content, rubric);
        return {
          category: rubric.category,
          score,
          maxPoints: rubric.points,
          feedback
        };
      });
    }

    const totalScore = rubricScores.reduce((sum, item) => sum + item.score, 0);

    return {
      fileName: file.name,
      totalScore,
      rubricScores
    };
  } catch (error) {
    console.error(`Error scoring file ${file.name}:`, error);
    throw error;
  }
}