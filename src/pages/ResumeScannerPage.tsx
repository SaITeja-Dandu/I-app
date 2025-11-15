/**
 * @file pages/ResumeScannerPage.tsx
 * @description Resume analysis and scoring page with modal upload
 */

import { useState } from 'react';
import { Button } from '../components/Button';
import { resumeAnalyzer, type ResumeAnalysis } from '../services/resume-analyzer';
import { createLogger } from '../utils/logger';

const logger = createLogger('resume-scanner');

interface ResumeScannerPageProps {
  onClose?: () => void;
  onAnalyzed?: (analysis: ResumeAnalysis) => void;
}

export const ResumeScannerPage: React.FC<ResumeScannerPageProps> = ({ onClose, onAnalyzed }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['.txt', '.pdf', '.docx'];
      const isValidType = validTypes.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        setError('📄 Only .txt, .pdf, and .docx files are supported');
        setSelectedFile(null);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      logger.info('Starting resume analysis');
      
      const text = await resumeAnalyzer.extractTextFromFile(selectedFile);
      const result = resumeAnalyzer.analyzeResume(text);
      
      setAnalysis(result);
      onAnalyzed?.(result);
      logger.info('Resume analyzed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze resume';
      setError(errorMsg);
      logger.error({ error: err }, 'Resume analysis failed');
    } finally {
      setLoading(false);
    }
  };

  // Always render as modal popup
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'clamp(16px, 4vw, 24px)',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: 'clamp(24px, 5vw, 40px)',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 20px 25px rgba(0,0,0,0.2)',
        maxHeight: '95vh',
        overflowY: 'auto',
        margin: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#111', margin: '0' }}>
            {!analysis ? '📄 Resume Scanner' : 'Resume Analysis'}
          </h1>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {!analysis ? (
          <>
            {/* Upload View */}
            <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', color: '#666', marginBottom: '24px', margin: '0 0 24px 0' }}>
              Upload your resume and get instant feedback with improvement suggestions
            </p>

            <div style={{ marginBottom: '24px' }}>
              <div style={{
                border: '2px dashed #0066cc',
                borderRadius: '8px',
                padding: 'clamp(24px, 5vw, 40px)',
                textAlign: 'center',
                cursor: 'pointer',
                background: selectedFile ? '#e6f2ff' : '#f9f9f9',
                transition: 'all 200ms'
              }}>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="resume-input"
                />
                <label htmlFor="resume-input" style={{ cursor: 'pointer', display: 'block' }}>
                  <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold', color: '#0066cc', marginBottom: '8px', margin: '0 0 8px 0' }}>
                    {selectedFile ? '✓ ' + selectedFile.name : '📎 Click to upload'}
                  </p>
                  <p style={{ fontSize: 'clamp(13px, 3vw, 14px)', color: '#666', margin: '0', marginBottom: '8px' }}>
                    or drag file here
                  </p>
                  <p style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#999', margin: '0' }}>
                    TXT, PDF, DOCX • Max 10MB
                  </p>
                </label>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: '20px', padding: '14px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00', fontSize: 'clamp(12px, 3vw, 13px)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                variant="primary"
                size="lg"
                style={{ flex: 1, fontSize: 'clamp(14px, 3vw, 16px)' }}
              >
                {loading ? '🔄 Analyzing...' : '✨ Analyze Resume'}
              </Button>
              {onClose && (
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="lg"
                  style={{ flex: 1, fontSize: 'clamp(14px, 3vw, 16px)' }}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* How it works */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'clamp(12px, 3vw, 16px)' }}>
              <div style={{ background: '#f9f9f9', padding: 'clamp(16px, 3vw, 20px)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '8px', margin: '0 0 8px 0' }}>📎</p>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '4px', margin: '0 0 4px 0' }}>Upload</h3>
                <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#666', margin: '0' }}>Select your file</p>
              </div>

              <div style={{ background: '#f9f9f9', padding: 'clamp(16px, 3vw, 20px)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '8px', margin: '0 0 8px 0' }}>🤖</p>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '4px', margin: '0 0 4px 0' }}>AI Analyzes</h3>
                <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#666', margin: '0' }}>Get insights</p>
              </div>

              <div style={{ background: '#f9f9f9', padding: 'clamp(16px, 3vw, 20px)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', marginBottom: '8px', margin: '0 0 8px 0' }}>✨</p>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '4px', margin: '0 0 4px 0' }}>Results</h3>
                <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#666', margin: '0' }}>View analysis</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Analysis Results View */}
            {/* Score Card */}
            <div style={{ background: '#f9f9f9', padding: 'clamp(20px, 4vw, 28px)', borderRadius: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 'clamp(16px, 3vw, 24px)', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'clamp(42px, 11vw, 64px)', fontWeight: 'bold', color: analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444', marginBottom: '8px' }}>
                    {analysis.score}
                  </div>
                  <p style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 'bold', color: analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444', margin: '0' }}>
                    {analysis.score >= 80 ? 'Excellent' : analysis.score >= 60 ? 'Good' : 'Needs Work'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: '#666', marginBottom: '8px', margin: '0 0 8px 0' }}>Resume Quality Score</p>
                  <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${analysis.score}%`, height: '100%', background: analysis.score >= 80 ? '#22c55e' : analysis.score >= 60 ? '#f59e0b' : '#ef4444', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            {analysis.skills.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '10px', margin: '0 0 10px 0' }}>
                  🛠️ Skills ({analysis.skills.length})
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {analysis.skills.map((skill) => (
                    <div key={skill} style={{ background: '#0066cc', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  💪 Strengths
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: '0', margin: '0' }}>
                  {analysis.strengths.map((strength, i) => (
                    <li key={i} style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#22c55e', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>✓</span> <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {analysis.improvements.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '8px', margin: '0 0 8px 0' }}>
                  🎯 Improvements
                </h3>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: '0', margin: '0' }}>
                  {analysis.improvements.map((improvement, i) => (
                    <li key={i} style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#f59e0b', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0 }}>→</span> <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 'bold', color: '#111', marginBottom: '10px', margin: '0 0 10px 0' }}>
                  💡 Suggestions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {analysis.suggestions.map((suggestion, i) => (
                    <div key={i} style={{ padding: '10px', background: '#f0f4ff', borderLeft: '3px solid #0066cc', borderRadius: '4px' }}>
                      <p style={{ fontSize: 'clamp(12px, 3vw, 13px)', color: '#333', margin: '0', lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 'bold' }}>{i + 1}.</span> {suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Button */}
            {onClose && (
              <Button
                onClick={onClose}
                variant="secondary"
                size="lg"
                style={{ width: '100%', fontSize: 'clamp(14px, 3vw, 16px)' }}
              >
                ← Back to Setup
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeScannerPage;
