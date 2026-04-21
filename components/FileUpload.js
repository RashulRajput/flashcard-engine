'use client';

import { useState, useRef } from 'react';

export default function FileUpload({ onGenerated, isGenerating, setIsGenerating }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | extracting | generating | error
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const extractTextFromPdf = async (pdfFile) => {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    let fullText = '';
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n\n';
      setProgress(Math.round((i / totalPages) * 50));
    }

    return fullText;
  };

  const handleFile = async (selectedFile) => {
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size must be under 20MB.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setStatus('extracting');
    setProgress(0);
    setIsGenerating(true);

    try {
      // Step 1: Extract text
      const text = await extractTextFromPdf(selectedFile);

      if (text.trim().length < 100) {
        throw new Error('Could not extract enough text from this PDF. It may be image-based or encrypted.');
      }

      setStatus('generating');
      setProgress(55);

      // Step 2: Send to Gemini API
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, numCards: 15 }),
      });

      setProgress(85);

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      const data = await res.json();
      setProgress(100);

      // Brief pause to show completion
      await new Promise((r) => setTimeout(r, 500));

      onGenerated({
        id: `deck_${Date.now()}`,
        title: selectedFile.name.replace('.pdf', ''),
        cards: data.cards,
        createdAt: new Date().toISOString(),
        cardStates: {},
      });

      setStatus('idle');
      setFile(null);
      setProgress(0);
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const statusMessages = {
    idle: null,
    extracting: 'Extracting text from PDF...',
    generating: 'Gemini is creating your flashcards...',
    error: error,
  };

  return (
    <div className="upload-container animate-fade-in-up">
      <div
        className={`upload-zone ${dragActive ? 'active' : ''} ${status !== 'idle' ? 'processing' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        id="upload-zone"
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          style={{ display: 'none' }}
          id="file-input"
        />

        {status === 'idle' ? (
          <div className="upload-content">
            <div className="upload-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="12" y2="12" />
                <line x1="15" y1="15" x2="12" y2="12" />
              </svg>
            </div>
            <h3>Drop your PDF here</h3>
            <p>or click to browse · Max 20MB</p>
          </div>
        ) : status === 'error' ? (
          <div className="upload-content error-state">
            <div className="upload-icon error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setStatus('idle');
                setError('');
                setFile(null);
              }}
              style={{ marginTop: '12px' }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="upload-content processing-state">
            <div className="processing-spinner">
              <div className="spinner spinner-lg" />
            </div>
            <h3>{file?.name}</h3>
            <p>{statusMessages[status]}</p>
            <div className="progress-bar" style={{ marginTop: '16px', maxWidth: '300px' }}>
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-percent">{progress}%</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .upload-container {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
        }

        .upload-zone {
          position: relative;
          padding: 48px 32px;
          border: 2px dashed var(--border-subtle);
          border-radius: var(--radius-xl);
          background: var(--bg-glass);
          cursor: pointer;
          transition: all var(--transition-normal);
          text-align: center;
        }

        .upload-zone:hover,
        .upload-zone.active {
          border-color: var(--accent-primary);
          background: rgba(108, 99, 255, 0.05);
          box-shadow: var(--shadow-glow);
        }

        .upload-zone.processing {
          cursor: default;
          border-style: solid;
          border-color: var(--border-accent);
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .upload-icon {
          color: var(--accent-primary);
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .error-icon {
          color: var(--accent-danger);
        }

        .upload-content h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .upload-content p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 300px;
        }

        .error-state p {
          color: var(--accent-danger);
        }

        .processing-spinner {
          margin-bottom: 8px;
        }

        .progress-percent {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 6px;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
