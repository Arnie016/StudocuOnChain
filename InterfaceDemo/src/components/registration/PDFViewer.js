import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';
import { buildGatewayUrls, buildIpfsUrl } from '../../utils/ipfs';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFViewer({ ipfsHash, onClose, pdfPassword, fallbackUrl }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gatewayIndex, setGatewayIndex] = useState(0);
    const loadTimeoutRef = useRef(null);

    const ipfsGateways = useMemo(() => buildGatewayUrls(ipfsHash), [ipfsHash]);
    const defaultDownloadUrl = useMemo(() => buildIpfsUrl(ipfsHash), [ipfsHash]);
    const pinataDownloadUrl = useMemo(() => buildIpfsUrl(ipfsHash, 'https://gateway.pinata.cloud/ipfs/'), [ipfsHash]);
    const sources = useMemo(() => {
        const list = [...ipfsGateways];
        if (fallbackUrl) {
            list.push({ name: 'Local preview', url: fallbackUrl });
        }
        return list;
    }, [ipfsGateways, fallbackUrl]);
    const currentSource = sources[gatewayIndex];

    useEffect(() => {
        if (gatewayIndex >= sources.length) {
            setGatewayIndex(0);
        }
    }, [gatewayIndex, sources.length]);

    // Reset when hash changes
    useEffect(() => {
        setGatewayIndex(0);
        setNumPages(null);
        setPageNumber(1);

        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }

        if (!ipfsHash && !fallbackUrl) {
            setLoading(false);
            setError('No IPFS hash provided.');
            return;
        }

        if (!sources.length) {
            setLoading(false);
            setError('Invalid document reference.');
            return;
        }

        setLoading(true);
        setError(null);

        loadTimeoutRef.current = setTimeout(() => {
            setError('PDF loading is taking too long. The file may not be accessible via this gateway or may have CORS restrictions. Try downloading it instead or use the "Open in new tab" link.');
            setLoading(false);
        }, 15000);

        return () => {
            if (loadTimeoutRef.current) {
                clearTimeout(loadTimeoutRef.current);
                loadTimeoutRef.current = null;
            }
        };
    }, [ipfsHash, sources.length, fallbackUrl]);

    function onDocumentLoadSuccess({ numPages }) {
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
        setNumPages(numPages);
        setLoading(false);
        setError(null);
    }

    function onDocumentLoadError(error) {
        if (loadTimeoutRef.current) {
            clearTimeout(loadTimeoutRef.current);
            loadTimeoutRef.current = null;
        }
        
        console.error(`PDF load error from ${currentSource?.name || 'unknown source'}:`, error);
        
        // Try next gateway
        if (gatewayIndex < sources.length - 1) {
            const nextIndex = gatewayIndex + 1;
            setError(`Trying gateway ${nextIndex + 1}/${sources.length} (${sources[nextIndex]?.name})...`);
            setTimeout(() => {
                setGatewayIndex(nextIndex);
                setLoading(true);
                setError(null);
            }, 500);
        } else {
            setLoading(false);
            setError(`All available sources failed. The file may not be accessible via these gateways. Click "Download" to access it directly.`);
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
                            <p>Loading PDF from {currentSource?.name || 'gateway'}...</p>
                            <p className="pdf-error-hint pdf-error-hint--loading">
                                If this takes too long, the file may not be accessible via this gateway.
                                <br />
                                {defaultDownloadUrl && (
                                    <a 
                                        href={defaultDownloadUrl}
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="pdf-inline-link"
                                    >
                                        Try opening in new tab instead
                                    </a>
                                )}
                            </p>
                            {error && <p className="pdf-error-hint">{error}</p>}
                        </div>
                    )}
                    {error && !loading && (
                        <div className="pdf-error">
                            <p>{error}</p>
                            <div className="pdf-error-actions">
                                {defaultDownloadUrl && (
                                    <a 
                                        href={defaultDownloadUrl}
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn--primary"
                                    >
                                        Try in new tab (IPFS.io)
                                    </a>
                                )}
                                {pinataDownloadUrl && pinataDownloadUrl !== defaultDownloadUrl && (
                                    <a 
                                        href={pinataDownloadUrl}
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn--ghost"
                                    >
                                        Try Pinata gateway
                                    </a>
                                )}
                            </div>
                            <p className="pdf-error-hint">
                                Note: If the PDF was just uploaded, it may take a few minutes to propagate across IPFS gateways.
                            </p>
                        </div>
                    )}
                    {!error && !loading && currentSource?.url && (
                        <Document
                            key={`${currentSource.url}-${gatewayIndex}`}
                            file={{
                                url: currentSource.url,
                                httpHeaders: {},
                                withCredentials: false,
                                password: pdfPassword || undefined,
                            }}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={<div className="pdf-loading">Loading PDF from {currentSource?.name || 'gateway'}...</div>}
                            options={{
                                cMapUrl: `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/cmaps/`,
                                cMapPacked: true,
                                httpHeaders: {},
                                withCredentials: false,
                            }}
                            error={
                                <div className="pdf-error">
                                    <p>Failed to load PDF from {currentSource?.name || 'gateway'}</p>
                                    <div className="pdf-error-actions">
                                        {(defaultDownloadUrl || pinataDownloadUrl) && (
                                            <a 
                                                href={defaultDownloadUrl || pinataDownloadUrl}
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="btn btn--primary"
                                            >
                                                Open in new tab
                                            </a>
                                        )}
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
