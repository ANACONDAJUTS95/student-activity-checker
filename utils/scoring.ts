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
    if (!line.trim()) continue; // Skip empty lines
    
    // Try multiple patterns to be more flexible:
    // Pattern 1: "• Category (X points) - Description"
    // Pattern 2: "Category (X points): Description"
    // Pattern 3: "Category - X points - Description"
    // Pattern 4: "Category: X points - Description"
    // Pattern 5: Just "Category (X points)"
    
    let match = line.match(/^[•\-*]?\s*([^(]+)\s*\((\d+)\s*(?:points?|pts?)\)\s*[-:]\s*(.+)$/i);
    if (!match) {
      match = line.match(/^[•\-*]?\s*([^(]+)\s*\((\d+)\s*(?:points?|pts?)\)\s*[:]?\s*(.*)$/i);
    }
    if (!match) {
      match = line.match(/^[•\-*]?\s*([^-]+)\s*-\s*(\d+)\s*(?:points?|pts?)\s*-\s*(.+)$/i);
    }
    if (!match) {
      match = line.match(/^[•\-*]?\s*([^:]+):\s*(\d+)\s*(?:points?|pts?)\s*-\s*(.+)$/i);
    }
    
    if (match) {
      rubrics.push({
        category: match[1].trim(),
        points: parseInt(match[2], 10),
        description: match[3]?.trim() || match[1].trim() // Use category as description if none provided
      });
    }
  }

  console.log('Parsed rubrics:', rubrics); // Debug logging
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

// AI Detection Patterns
function detectAIContent(text: string): { isLikelyAI: boolean; confidence: number; reasons: string[] } {
  const reasons: string[] = [];
  let aiScore = 0;
  
  const normalizedText = text.toLowerCase();
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = normalizedText.split(/\s+/);
  
  // 1. Check for common AI phrases
  const aiPhrases = [
    'in conclusion', 'to summarize', 'it is important to note',
    'in today\'s world', 'in today\'s society', 'in modern society',
    'it is worth noting', 'it is essential to', 'one must consider',
    'furthermore', 'moreover', 'nevertheless', 'notwithstanding',
    'delve into', 'delves into', 'tapestry', 'landscape of',
    'it\'s important to understand', 'plays a crucial role',
    'comprehensive understanding', 'multifaceted', 'intricate web'
  ];
  
  let aiPhraseCount = 0;
  aiPhrases.forEach(phrase => {
    if (normalizedText.includes(phrase)) {
      aiPhraseCount++;
    }
  });
  
  if (aiPhraseCount > 3) {
    aiScore += 25;
    reasons.push('Multiple AI-typical phrases detected');
  } else if (aiPhraseCount > 1) {
    aiScore += 10;
  }
  
  // 2. Check sentence length uniformity (AI often produces similar length sentences)
  if (sentences.length > 5) {
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 5 && sentences.length > 8) {
      aiScore += 20;
      reasons.push('Uniform sentence structure');
    }
  }
  
  // 3. Check for overly formal/academic language without personal voice
  const formalWords = ['furthermore', 'moreover', 'nevertheless', 'consequently', 'therefore', 'thus', 'hence'];
  const personalWords = ['i', 'my', 'me', 'personally', 'feel', 'believe', 'think'];
  
  const formalCount = formalWords.filter(word => normalizedText.includes(word)).length;
  const personalCount = personalWords.filter(word => normalizedText.split(/\s+/).includes(word)).length;
  
  if (formalCount > 3 && personalCount === 0 && words.length > 200) {
    aiScore += 15;
    reasons.push('Lacks personal voice');
  }
  
  // 4. Check for perfect grammar (too perfect can indicate AI)
  const hasTypos = /\b\w{15,}\b/.test(text) || text.includes('  '); // Very long words or double spaces
  if (!hasTypos && words.length > 300) {
    aiScore += 10;
  }
  
  // 5. Check for repetitive structure (AI often follows templates)
  const startsWithSame = sentences.slice(0, Math.min(5, sentences.length))
    .map(s => s.trim().split(/\s+/)[0])
    .filter((word, idx, arr) => arr.indexOf(word) !== idx).length;
  
  if (startsWithSame > 2) {
    aiScore += 15;
    reasons.push('Repetitive sentence patterns');
  }
  
  return {
    isLikelyAI: aiScore > 40,
    confidence: Math.min(aiScore, 100),
    reasons
  };
}

// Quality Checks
function analyzeContentQuality(text: string, rubricItem: RubricItem): {
  qualityScore: number;
  issues: string[];
} {
  const issues: string[] = [];
  let qualityScore = 100;
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  // 1. Word count check (essays should have substance)
  const wordCount = words.length;
  if (wordCount < 100) {
    qualityScore -= 30;
    issues.push('Very short content');
  } else if (wordCount < 200) {
    qualityScore -= 15;
    issues.push('Brief content');
  }
  
  // 2. Sentence variety check
  if (sentences.length > 0) {
    const avgWordsPerSentence = wordCount / sentences.length;
    if (avgWordsPerSentence < 8) {
      qualityScore -= 10;
      issues.push('Choppy sentences');
    } else if (avgWordsPerSentence > 35) {
      qualityScore -= 10;
      issues.push('Overly long sentences');
    }
  }
  
  // 3. Paragraph structure
  if (paragraphs.length < 2 && wordCount > 200) {
    qualityScore -= 15;
    issues.push('Poor paragraph structure');
  }
  
  // 4. Vocabulary diversity
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const vocabularyDiversity = uniqueWords.size / words.length;
  
  if (vocabularyDiversity < 0.3) {
    qualityScore -= 20;
    issues.push('Limited vocabulary');
  } else if (vocabularyDiversity < 0.4) {
    qualityScore -= 10;
    issues.push('Repetitive word choice');
  }
  
  // 5. Depth check - look for analysis words vs just description
  const analysisWords = ['because', 'therefore', 'however', 'although', 'while', 'whereas', 'consequently', 'analysis', 'argue', 'suggest', 'implies', 'demonstrates'];
  const analysisCount = analysisWords.filter(word => 
    text.toLowerCase().includes(word)
  ).length;
  
  if (analysisCount === 0 && rubricItem.description.toLowerCase().includes('analysis')) {
    qualityScore -= 25;
    issues.push('Lacks analytical depth');
  } else if (analysisCount < 2 && wordCount > 300) {
    qualityScore -= 10;
    issues.push('Limited analysis');
  }
  
  return {
    qualityScore: Math.max(qualityScore, 0),
    issues
  };
}

function calculateScore(text: string, rubricItem: RubricItem): {
  score: number;
  feedback: string;
} {
  const { description, points, category } = rubricItem;
  
  // Normalize and clean text
  const normalizedText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const normalizedDescription = description.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Extract meaningful keywords (filter out common words)
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its', 'their', 'there', 'when', 'where', 'which', 'who', 'why', 'how']);
  
  const keywords = normalizedDescription
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  const textWords = normalizedText.split(/\s+/);
  const textSet = new Set(textWords);
  
  // Run AI detection
  const aiDetection = detectAIContent(text);
  
  // Run quality analysis
  const qualityAnalysis = analyzeContentQuality(text, rubricItem);
  
  // Calculate base content match
  let contentScore = 0;
  
  if (keywords.length === 0) {
    contentScore = 70; // Base score if no keywords
  } else {
    // Count direct matches
    const directMatches = keywords.filter(keyword => textSet.has(keyword)).length;
    
    // Count partial matches (keyword contained in text words)
    const partialMatches = keywords.filter(keyword => 
      textWords.some(word => word.includes(keyword) || keyword.includes(word))
    ).length;
    
    // Calculate match ratio with stricter requirements
    const directRatio = directMatches / keywords.length;
    const partialRatio = partialMatches / keywords.length;
    const matchRatio = (directRatio * 0.7) + (partialRatio * 0.3); // Favor direct matches
    
    // Content score ranges from 40% to 95% based on matches
    contentScore = 40 + (matchRatio * 55);
  }
  
  // Apply quality multiplier (0.5 to 1.0)
  const qualityMultiplier = qualityAnalysis.qualityScore / 100;
  let finalScore = contentScore * qualityMultiplier;
  
  // Apply AI detection penalty (up to 40% deduction)
  if (aiDetection.isLikelyAI) {
    const aiPenalty = (aiDetection.confidence / 100) * 0.4; // Up to 40% penalty
    finalScore = finalScore * (1 - aiPenalty);
  }
  
  // Add random variation (±8%) to avoid identical scores
  const randomVariation = 0.92 + (Math.random() * 0.16); // 0.92 to 1.08
  finalScore = finalScore * randomVariation;
  
  // Calculate final score as percentage of points with minimum of 85%
  const calculatedScore = Math.round((finalScore / 100) * points);
  const minimumScore = Math.round(points * 0.85); // Minimum 85% of max points
  const score = Math.max(minimumScore, Math.min(points, calculatedScore));
  
  // Generate comprehensive feedback
  const feedbackParts: string[] = [];
  
  // Content match feedback
  if (contentScore > 85) {
    feedbackParts.push('Strong content match');
  } else if (contentScore > 70) {
    feedbackParts.push('Good content coverage');
  } else if (contentScore > 55) {
    feedbackParts.push('Adequate content');
  } else {
    feedbackParts.push('Limited content match');
  }
  
  // Quality issues
  if (qualityAnalysis.issues.length > 0) {
    feedbackParts.push(qualityAnalysis.issues[0]); // Show primary issue
  }
  
  // AI detection feedback
  if (aiDetection.isLikelyAI && aiDetection.confidence > 60) {
    feedbackParts.push('⚠️ Possible AI-generated (-' + Math.round(aiDetection.confidence * 0.4) + '%)');
  } else if (aiDetection.confidence > 40) {
    feedbackParts.push('Some AI-like patterns detected');
  }
  
  const feedback = feedbackParts.join(' • ');
  
  console.log(`Scoring ${category}:`, {
    contentScore: contentScore.toFixed(1),
    qualityMultiplier: qualityMultiplier.toFixed(2),
    aiConfidence: aiDetection.confidence,
    finalScore: score,
    maxPoints: points
  });
  
  return { score, feedback };
}

export async function scoreFile(
  file: File,
  rubrics: RubricItem[]
): Promise<ScoringResult> {
  try {
    const fileType = file.name.toLowerCase().split('.').pop();
    const isImage = ['jpg', 'jpeg', 'png'].includes(fileType || '');

    // Generate a seed from filename for consistent but varied randomization per file
    const fileSeed = file.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    Math.random(); // Advance the random state

    let rubricScores;
    if (isImage) {
      const { scoreImage } = await import('./imageProcessing');
      rubricScores = await scoreImage(file, rubrics);
    } else {
      const content = await extractTextFromFile(file);
      rubricScores = rubrics.map((rubric, index) => {
        // Add per-rubric variation based on file and rubric position
        const rubricVariation = ((fileSeed + index) % 7) / 100; // 0-6% variation per rubric
        const { score, feedback } = calculateScore(content, rubric);
        
        // Apply slight rubric-specific adjustment
        const adjustedScore = Math.min(rubric.points, Math.round(score * (1 + rubricVariation)));
        
        return {
          category: rubric.category,
          score: adjustedScore,
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