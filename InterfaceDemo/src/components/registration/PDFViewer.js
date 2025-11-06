import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ ipfsHash, onClose }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gatewayIndex, setGatewayIndex] = useState(0);
    const [loadTimeout, setLoadTimeout] = useState(null);

    // IPFS gateway URL - try multiple gateways for reliability
    const ipfsGateways = [
        { url: `https://ipfs.io/ipfs/${ipfsHash}`, name: 'IPFS.io' },
        { url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`, name: 'Pinata' },
        { url: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`, name: 'Cloudflare' },
        { url: `https://dweb.link/ipfs/${ipfsHash}`, name: 'dweb.link' },
        { url: `https://ipfs.infura.io/ipfs/${ipfsHash}`, name: 'Infura' }
    ];

    const pdfUrl = ipfsGateways[gatewayIndex]?.url;

    // Reset when hash changes
    useEffect(() => {
        setGatewayIndex(0);
        setNumPages(null);
        setPageNumber(1);
        setLoading(true);
        setError(null);
        
        // Clear any existing timeout
        if (loadTimeout) {
            clearTimeout(loadTimeout);
        }
        
        // Set a timeout to detect if loading is stuck (15 seconds)
        const timeout = setTimeout(() => {
            setError('PDF loading is taking too long. The file may not be accessible via this gateway or may have CORS restrictions. Try downloading it instead or use the "Open in new tab" link.');
            setLoading(false);
        }, 15000); // 15 second timeout
        
        setLoadTimeout(timeout);
        
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [ipfsHash]);

    function onDocumentLoadSuccess({ numPages }) {
        if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
        }
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }

    function onDocumentLoadError(error) {
        if (loadTimeout) {
            clearTimeout(loadTimeout);
            setLoadTimeout(null);
        }
        
        console.error(`PDF load error from ${ipfsGateways[gatewayIndex]?.name}:`, error);
        
        // Try next gateway
        if (gatewayIndex < ipfsGateways.length - 1) {
            const nextIndex = gatewayIndex + 1;
            setError(`Trying gateway ${nextIndex + 1}/${ipfsGateways.length} (${ipfsGateways[nextIndex]?.name})...`);
            setTimeout(() => {
                setGatewayIndex(nextIndex);
                setLoading(true);
                setError(null);
            }, 500);
        } else {
            setLoading(false);
            setError(`All ${ipfsGateways.length} IPFS gateways failed. The file may not be accessible via these gateways. Click "Download" to access it directly.`);
        }
    }

    return (
        <div className="pdf-viewer-overlay" onClick={onClose}>
            <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
                <div className="pdf-viewer-header">
                    <h3>PDF Preview</h3>
                    <button className="btn btn--ghost" onClick={onClose}>Close</button>
                </div>
                
                <div className="pdf-viewer-controls">
                    <button
                        className="btn btn--ghost"
                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber <= 1}
                    >
                        Previous
                    </button>
                    <span className="pdf-page-info">
                        Page {pageNumber} of {numPages || '?'}
                    </span>
                    <button
                        className="btn btn--ghost"
                        onClick={() => setPageNumber(Math.min(numPages || 1, pageNumber + 1))}
                        disabled={pageNumber >= (numPages || 1)}
                    >
                        Next
                    </button>
                </div>

                <div className="pdf-viewer-content">
                    {loading && (
                        <div className="pdf-loading">
                            <p>Loading PDF from {ipfsGateways[gatewayIndex]?.name}...</p>
                            <p className="pdf-error-hint" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                                If this takes too long, the file may not be accessible via this gateway.
                                <br />
                                <a 
                                    href={`https://ipfs.io/ipfs/${ipfsHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: 'var(--accent-primary)', textDecoration: 'underline', marginTop: '0.5rem', display: 'inline-block' }}
                                >
                                    Try opening in new tab instead
                                </a>
                            </p>
                            {error && <p className="pdf-error-hint">{error}</p>}
                        </div>
                    )}
                    {error && !loading && (
                        <div className="pdf-error">
                            <p>{error}</p>
                            <div className="pdf-error-actions">
                                <a 
                                    href={`https://ipfs.io/ipfs/${ipfsHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn--primary"
                                >
                                    Try in new tab (IPFS.io)
                                </a>
                                <a 
                                    href={`https://gateway.pinata.cloud/ipfs/${ipfsHash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn btn--ghost"
                                >
                                    Try Pinata gateway
                                </a>
                            </div>
                            <p className="pdf-error-hint">
                                Note: If the PDF was just uploaded, it may take a few minutes to propagate across IPFS gateways.
                            </p>
                        </div>
                    )}
                    {!error && !loading && pdfUrl && (
                        <Document
                            key={`${pdfUrl}-${gatewayIndex}`}
                            file={{
                                url: pdfUrl,
                                httpHeaders: {},
                                withCredentials: false,
                            }}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={<div className="pdf-loading">Loading PDF from {ipfsGateways[gatewayIndex]?.name}...</div>}
                            options={{
                                cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
                                cMapPacked: true,
                                httpHeaders: {},
                                withCredentials: false,
                            }}
                            error={
                                <div className="pdf-error">
                                    <p>Failed to load PDF from {ipfsGateways[gatewayIndex]?.name}</p>
                                    <div className="pdf-error-actions">
                                        <a 
                                            href={`https://ipfs.io/ipfs/${ipfsHash}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="btn btn--primary"
                                        >
                                            Open in new tab
                                        </a>
                                    </div>
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="pdf-page"
                            />
                        </Document>
                    )}
                </div>
            </div>
        </div>
    );
}

