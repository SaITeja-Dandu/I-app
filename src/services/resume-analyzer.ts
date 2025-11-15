/**
 * @file services/resume-analyzer.ts
 * @description Service to analyze resume content and extract information
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { createLogger } from '../utils/logger';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const logger = createLogger('resume-analyzer');

export interface ResumeAnalysis {
  fullText: string;
  skills: string[];
  experience: string[];
  qualifications: string[];
  score: number;
  suggestions: string[];
  strengths: string[];
  improvements: string[];
}

export const resumeAnalyzer = {
  /**
   * Analyze resume text and extract key information
   */
  analyzeResume(text: string): ResumeAnalysis {
    try {
      logger.info('Starting resume analysis');
      
      const lowerText = text.toLowerCase();
      
      // Extract skills (common technical skills)
      const skillKeywords = [
        'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'express', 'sql', 'mongodb',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'rest api', 'graphql', 'git', 'ci/cd',
        'html', 'css', 'vue.js', 'angular', 'next.js', 'postgresql', 'mysql', 'redis', 'rabbitmq',
        'microservices', 'agile', 'scrum', 'testing', 'jest', 'webpack', 'npm', 'yarn', 'terraform'
      ];
      
      const skills: string[] = [];
      skillKeywords.forEach(skill => {
        if (lowerText.includes(skill)) {
          skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
      });
      
      // Extract experience levels
      const experience: string[] = [];
      const yearMatch = text.match(/(\d+)\s*(?:years?|yrs?)/gi);
      if (yearMatch) {
        experience.push(...yearMatch);
      }
      
      // Extract education/qualifications
      const qualificationKeywords = ['bachelor', 'master', 'phd', 'certification', 'diploma', 'degree', 'associate'];
      const qualifications: string[] = [];
      qualificationKeywords.forEach(qual => {
        if (lowerText.includes(qual)) {
          qualifications.push(qual.charAt(0).toUpperCase() + qual.slice(1));
        }
      });
      
      // Calculate score based on resume content
      let score = 0;
      score += Math.min(skills.length * 5, 30); // Up to 30 points for skills
      score += experience.length > 0 ? 20 : 0; // 20 points for experience
      score += qualifications.length * 10; // 10 points per qualification
      score += text.split('\n').length > 5 ? 20 : 10; // Structure score
      score = Math.min(score, 100);
      
      // Generate suggestions
      const suggestions: string[] = [];
      if (skills.length < 5) {
        suggestions.push('Add more technical skills to highlight your expertise');
      }
      if (!lowerText.includes('achievement') && !lowerText.includes('accomplishment')) {
        suggestions.push('Include specific achievements and accomplishments');
      }
      if (!lowerText.includes('quantifi') && !lowerText.includes('metric')) {
        suggestions.push('Use metrics and numbers to showcase impact (e.g., "improved performance by 40%")');
      }
      if (text.split('\n').length < 10) {
        suggestions.push('Consider adding more detail to your work experience');
      }
      if (!lowerText.includes('project')) {
        suggestions.push('Highlight key projects you\'ve worked on');
      }
      
      // Identify strengths
      const strengths: string[] = [];
      if (skills.length >= 8) strengths.push('Strong technical skill set');
      if (qualifications.length > 0) strengths.push('Good educational background');
      if (text.length > 1000) strengths.push('Comprehensive work history');
      if (experience.length > 0) strengths.push('Relevant experience documented');
      
      // Identify improvements needed
      const improvements: string[] = [];
      if (skills.length < 5) improvements.push('Expand technical skills section');
      if (!lowerText.includes('impact') || !lowerText.includes('result')) {
        improvements.push('Add more results-oriented descriptions');
      }
      if (score < 70) improvements.push('Improve overall resume structure and content');
      
      logger.info(`Resume analysis complete. Score: ${score}, Skills found: ${skills.length}`);
      
      return {
        fullText: text,
        skills: [...new Set(skills)], // Remove duplicates
        experience,
        qualifications: [...new Set(qualifications)],
        score: Math.round(score),
        suggestions,
        strengths,
        improvements
      };
    } catch (error) {
      logger.error({ error }, 'Resume analysis failed');
      throw new Error('Failed to analyze resume');
    }
  },

  /**
   * Extract text from file (supports TXT, PDF, DOCX)
   */
  async extractTextFromFile(file: File): Promise<string> {
    try {
      // Handle PDF files
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        return await extractTextFromPDF(file);
      }
      
      // Handle DOCX files
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        return await extractTextFromDOCX(file);
      }
      
      // Handle text files
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        return await file.text();
      }
      
      // Try to read as text anyway
      const text = await file.text();
      if (text && text.trim()) return text;
      
      throw new Error(`Unsupported file format: ${file.type || file.name}`);
    } catch (error) {
      logger.error({ error }, 'Text extraction failed');
      throw error;
    }
  }
};

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter(item => 'str' in item)
        .map(item => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText || '';
  } catch (error) {
    logger.error({ error }, 'PDF extraction failed');
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX file
 */
async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  } catch (error) {
    logger.error({ error }, 'DOCX extraction failed');
    throw new Error('Failed to extract text from DOCX');
  }
}
