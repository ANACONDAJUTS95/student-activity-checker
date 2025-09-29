import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { createWorker } from 'tesseract.js';

// Initialize models
let imageModel: mobilenet.MobileNet | null = null;
let ocrWorker: Tesseract.Worker | null = null;

async function ensureModelsLoaded() {
  if (!imageModel) {
    imageModel = await mobilenet.load();
  }
  if (!ocrWorker) {
    ocrWorker = await createWorker('eng');
  }
}

async function processImage(file: File): Promise<{
  text: string;
  visualFeatures: string[];
}> {
  await ensureModelsLoaded();

  // Create an image element
  const img = new Image();
  img.src = URL.createObjectURL(file);
  await new Promise(resolve => img.onload = resolve);

  // Get visual features using MobileNet
  const tfImg = tf.browser.fromPixels(img);
  const visualFeatures = await imageModel!.classify(tfImg);
  tfImg.dispose();

  // Extract text using Tesseract
  const { data: { text } } = await ocrWorker!.recognize(img);

  return {
    text,
    visualFeatures: visualFeatures.map(f => f.className)
  };
}

export async function scoreImage(
  file: File,
  rubrics: {
    category: string;
    points: number;
    description: string;
  }[]
): Promise<{
  category: string;
  score: number;
  maxPoints: number;
  feedback: string;
}[]> {
  try {
    const { text, visualFeatures } = await processImage(file);
    const combinedContent = `${text} ${visualFeatures.join(' ')}`.toLowerCase();

    return rubrics.map(rubric => {
      const { description, points } = rubric;
      const keywords = description.toLowerCase().split(' ');
      
      // Calculate matches based on both text and visual features
      const matches = keywords.filter(keyword => 
        combinedContent.includes(keyword)
      ).length;
      
      const matchRatio = matches / keywords.length;
      // Adjust the ratio to start from 0.75 (75%) and go up to 1.0 (100%)
      const adjustedRatio = 0.75 + (matchRatio * 0.25);
      const score = Math.round(points * adjustedRatio);
      
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
      
      return {
        category: rubric.category,
        score,
        maxPoints: points,
        feedback
      };
    });
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}