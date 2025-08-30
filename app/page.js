'use client';

import { useState } from 'react';

export default function RAGSystem() {
    const [selectedType, setSelectedType] = useState('');
    const [documentInput, setDocumentInput] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isIndexing, setIsIndexing] = useState(false);
    const [indexingResult, setIndexingResult] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatting, setIsChatting] = useState(false);
    const [isDocumentIndexed, setIsDocumentIndexed] = useState(false);

    const selectType = (type) => {
        setSelectedType(type);
        setDocumentInput('');
        setUploadedFile(null);
        setIndexingResult(null);
        
        // Reset file upload area
        const uploadArea = document.querySelector('.file-upload-area');
        if (uploadArea) {
            uploadArea.classList.remove('active');
            uploadArea.innerHTML = `
                <div class="file-upload-icon">☁️</div>
                <div class="file-upload-text">Click to upload file</div>
                <div class="file-upload-subtext">Or drag and drop your file here</div>
            `;
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const fileName = file.name.toLowerCase();
        const expectedExtension = selectedType === 'pdf' ? '.pdf' : '.csv';
        
        if (!fileName.endsWith(expectedExtension)) {
            alert(`Please select a ${selectedType.toUpperCase()} file`);
            return;
        }

        setUploadedFile(file);
        
        // Update file upload area to show success
        const uploadArea = document.querySelector('.file-upload-area');
        if (uploadArea) {
            uploadArea.classList.add('active');
            uploadArea.innerHTML = `
                <div class="file-upload-icon">✅</div>
                <div class="file-upload-text" style="color: #059669;">File Selected: ${file.name}</div>
                <div class="file-upload-subtext">Ready to index (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>
            `;
        }
    };

    const indexDocument = async () => {
        if (!selectedType) {
            alert('Please select a document type!');
            return;
        }

        // Validate input based on type
        if (selectedType === 'url') {
            if (!documentInput.trim() || !documentInput.startsWith('http')) {
                alert('Please enter a valid URL starting with http:// or https://');
                return;
            }
        } else {
            if (!uploadedFile) {
                alert(`Please upload a ${selectedType.toUpperCase()} file!`);
                return;
            }
        }

        setIsIndexing(true);
        setIndexingResult(null);

        try {
            let response;

            if (selectedType === 'url') {
                // Handle URL indexing
                response = await fetch('/api/indexing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: documentInput,
                        type: selectedType,
                    }),
                });
            } else {
                // Handle file indexing
                const formData = new FormData();
                formData.append('file', uploadedFile);
                formData.append('type', selectedType);

                response = await fetch('/api/indexing', {
                    method: 'POST',
                    body: formData,
                });
            }

            const result = await response.json();

            if (result.success) {
                setIndexingResult({
                    type: 'success',
                    message: 'Document indexed successfully!',
                    details: selectedType === 'url' 
                        ? `URL: ${documentInput}` 
                        : `File: ${uploadedFile.name} (${result.documentsCount} chunks)`
                });
                setIsDocumentIndexed(true);
                addChatMessage('system', `✅ Document indexed successfully! You can now ask questions about your ${selectedType.toUpperCase()} document.`);
            } else {
                setIndexingResult({
                    type: 'error',
                    message: 'Indexing failed!',
                    details: result.error
                });
            }
        } catch (error) {
            setIndexingResult({
                type: 'error',
                message: 'Indexing failed!',
                details: error.message
            });
        } finally {
            setIsIndexing(false);
        }
    };

    const addChatMessage = (type, content) => {
        const newMessage = {
            id: Date.now(),
            type,
            content,
            timestamp: new Date().toLocaleTimeString()
        };
        setChatMessages(prev => [...prev, newMessage]);
    };

    const sendMessage = async () => {
        if (!chatInput.trim()) return;

        if (!isDocumentIndexed) {
            alert('Please index a document first before chatting!');
            return;
        }

        const message = chatInput.trim();
        addChatMessage('user', message);
        setChatInput('');
        setIsChatting(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
            });

            const result = await response.json();

            if (result.success) {
                addChatMessage('ai', result.response);
            } else {
                addChatMessage('system', `Error: ${result.error}`);
            }
        } catch (error) {
            addChatMessage('system', `Error: ${error.message}`);
        } finally {
            setIsChatting(false);
        }
    };

    const handleChatKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const getInputPlaceholder = () => {
        switch (selectedType) {
            case 'url':
                return 'Enter website URL (e.g., https://example.com)';
            case 'pdf':
            case 'csv':
                return `Upload a ${selectedType.toUpperCase()} file using the button below`;
            default:
                return 'Please select a document type first';
        }
    };

    const canIndex = () => {
        if (selectedType === 'url') {
            return documentInput.trim() && documentInput.startsWith('http');
        }
        return uploadedFile !== null;
    };

    return (
        <div>
            <div className="container">
                {/* Header */}
                <div className="header">
                    <h1>🤖 RAG System</h1>
                    <p>Document Indexing & Intelligent Chat Assistant</p>
                </div>

                <div className="grid">
                    {/* Document Indexing Section */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon">📤</div>
                            <h2 className="card-title">Document Indexing</h2>
                        </div>

                        {/* Type Selection */}
                        <div className="form-group">
                            <label className="form-label">Select Document Type:</label>
                            <div className="type-buttons">
                                {['pdf', 'csv', 'url'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => selectType(type)}
                                        className={`type-btn ${selectedType === type ? 'active' : ''}`}
                                    >
                                        <div className="type-btn-icon">
                                            {type === 'pdf' ? '📄' : type === 'csv' ? '📊' : '🌐'}
                                        </div>
                                        <span>{type.toUpperCase()}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* URL Input */}
                        {selectedType === 'url' && (
                            <div className="form-group">
                                <label className="form-label">Website URL:</label>
                                <input
                                    type="text"
                                    value={documentInput}
                                    onChange={(e) => setDocumentInput(e.target.value)}
                                    placeholder="https://example.com/article"
                                    className="form-input"
                                />
                            </div>
                        )}

                        {/* File Upload for PDF/CSV */}
                        {(selectedType === 'pdf' || selectedType === 'csv') && (
                            <div className="form-group">
                                <label className="form-label">Upload {selectedType.toUpperCase()} File:</label>
                                <div className="file-upload">
                                    <label>
                                        <input
                                            type="file"
                                            accept={selectedType === 'pdf' ? '.pdf' : '.csv'}
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="file-upload-area">
                                            <div className="file-upload-icon">☁️</div>
                                            <div className="file-upload-text">Click to upload {selectedType.toUpperCase()} file</div>
                                            <div className="file-upload-subtext">Or drag and drop your file here</div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Index Button */}
                        <button
                            onClick={indexDocument}
                            disabled={!selectedType || !canIndex() || isIndexing}
                            className="btn"
                        >
                            {isIndexing ? (
                                <>
                                    <div className="spinner"></div>
                                    Indexing...
                                </>
                            ) : (
                                <>
                                    ⚙️ Index Document
                                </>
                            )}
                        </button>

                        {/* Status Display */}
                        {isIndexing && (
                            <div className="status-card status-loading">
                                <div className="status-content">
                                    <div className="spinner"></div>
                                    <span>Processing document...</span>
                                </div>
                            </div>
                        )}

                        {indexingResult && (
                            <div className={`status-card status-${indexingResult.type}`}>
                                <div className="status-content">
                                    <span>{indexingResult.type === 'success' ? '✅' : '❌'}</span>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{indexingResult.message}</div>
                                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                            {indexingResult.details}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Chat Section */}
                    <div className="card">
                        <div className="card-header">
                            <div className="card-icon" style={{ background: 'linear-gradient(45deg, #10b981, #059669)' }}>💬</div>
                            <h2 className="card-title">Chat Assistant</h2>
                        </div>

                        {/* Chat Messages */}
                        <div className="chat-container">
                            {chatMessages.length === 0 ? (
                                <div className="chat-empty">
                                    <div className="chat-empty-icon">🤖</div>
                                    <div className="chat-empty-title">Start a conversation!</div>
                                    <div className="chat-empty-subtitle">
                                        {isDocumentIndexed ? 
                                            'Ask questions about your indexed documents' : 
                                            'Index a document first to enable chat'
                                        }
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`chat-message ${message.type}`}
                                        >
                                            <div className={`chat-bubble ${message.type}`}>
                                                <div>{message.content}</div>
                                                {message.type !== 'system' && (
                                                    <div className="chat-timestamp">
                                                        {message.timestamp}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {isChatting && (
                                        <div className="chat-message ai">
                                            <div className="chat-bubble ai">
                                                <div>AI is typing...</div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="chat-input-container">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={handleChatKeyPress}
                                placeholder={isDocumentIndexed ? "Ask about your documents..." : "Index a document first to enable chat"}
                                className="chat-input"
                                disabled={!isDocumentIndexed}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isChatting || !chatInput.trim() || !isDocumentIndexed}
                                className="chat-send-btn"
                            >
                                📤
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Examples */}
                <div className="examples-section">
                    <h3 className="examples-title">
                        💡 How to Use
                    </h3>
                    <div className="examples-grid">
                        <div className="example-card pdf">
                            <h4 className="example-title pdf">📄 PDF Documents</h4>
                            <p className="example-text pdf">Upload PDF files</p>
                            <p className="example-subtext pdf">Research papers, reports, manuals</p>
                        </div>
                        <div className="example-card csv">
                            <h4 className="example-title csv">📊 CSV Data</h4>
                            <p className="example-text csv">Upload CSV files</p>
                            <p className="example-subtext csv">Data tables, spreadsheets</p>
                        </div>
                        <div className="example-card url">
                            <h4 className="example-title url">🌐 Web Pages</h4>
                            <p className="example-text url">https://example.com/article</p>
                            <p className="example-subtext url">Articles, blogs, documentation</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}