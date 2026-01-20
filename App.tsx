import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { SignatureCreator } from './components/SignatureCreator';
import { Button } from './components/Button';
import { PDFPageData, FormField, AppState, FieldType } from './types';
import { convertPDFToImages, generateSignedPDF } from './services/pdfService';
import { detectSignatures } from './services/geminiService';
import { Download, ChevronLeft, ChevronRight, Wand2, RefreshCcw, CheckCircle2, Type, PenTool, Stamp } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD);
  const [pages, setPages] = useState<PDFPageData[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Store both signature and initials
  const [userSignatureUrl, setUserSignatureUrl] = useState<string | null>(null);
  const [userInitialsUrl, setUserInitialsUrl] = useState<string | null>(null);
  
  const [detectingPage, setDetectingPage] = useState<boolean>(false);

  // Handle file upload and conversion
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const pageImages = await convertPDFToImages(file);
      setPages(pageImages);
      setAppState(AppState.PREVIEW);
      // Automatically run detection on the first page
      if (pageImages.length > 0) {
        detectFieldsForPage(0, pageImages[0]);
      }
    } catch (error) {
      console.error("Error processing PDF", error);
      alert("Failed to process PDF. Please try a different file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Detection for a specific page
  const detectFieldsForPage = async (pageIndex: number, pageData: PDFPageData) => {
    setDetectingPage(true);
    try {
      const detected = await detectSignatures(pageData.imageUrl);
      
      const newFields: FormField[] = detected.map((item, i) => ({
        id: `field-${pageIndex}-${i}-${Date.now()}`,
        pageIndex,
        box: item.box,
        type: item.type,
        value: ''
      }));

      setFields(prev => {
        // Remove existing fields for this page to avoid duplicates if re-running
        const filtered = prev.filter(s => s.pageIndex !== pageIndex);
        return [...filtered, ...newFields];
      });

    } catch (error) {
      console.error("Detection failed", error);
    } finally {
      setDetectingPage(false);
    }
  };

  // Handle Signature/Initial Field Click
  const toggleSignature = (id: string, type: 'signature' | 'initial') => {
    if (!userSignatureUrl || !userInitialsUrl) {
      return;
    }
    
    setFields(prev => prev.map(f => {
      if (f.id !== id) return f;
      // Toggle value based on type
      const valueToSet = type === 'initial' ? userInitialsUrl : userSignatureUrl;
      return { ...f, value: f.value ? '' : valueToSet };
    }));
  };

  // Handle Text Field Change
  const updateTextField = (id: string, text: string) => {
    setFields(prev => prev.map(f => 
      f.id === id ? { ...f, value: text } : f
    ));
  };

  // Generate final PDF
  const handleDownload = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const pdfUrl = generateSignedPDF(pages, fields);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'signed_document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsProcessing(false);
    }, 100); // Small timeout to allow UI update
  };

  // --- Render Helpers ---

  const renderUploadState = () => (
    <div className="max-w-3xl mx-auto w-full px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">DocuGenius</h1>
        <p className="text-lg text-gray-600">Smart PDF signing and form filling with AI-powered field detection.</p>
      </div>
      <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
      
      {/* Disclaimer / Info */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Wand2 size={20} />
          </div>
          <h3 className="font-semibold text-gray-900">AI Detection</h3>
          <p className="text-sm text-gray-500 mt-1">Automatically finds signature lines, text boxes, and checkboxes.</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 size={20} />
          </div>
          <h3 className="font-semibold text-gray-900">Easy Filling</h3>
          <p className="text-sm text-gray-500 mt-1">Type directly into fields or click to apply your signature.</p>
        </div>
        <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Download size={20} />
          </div>
          <h3 className="font-semibold text-gray-900">Instant Export</h3>
          <p className="text-sm text-gray-500 mt-1">Download your completed PDF immediately.</p>
        </div>
      </div>
    </div>
  );

  const renderWorkspace = () => {
    const pageData = pages[currentPage];
    const pageFields = fields.filter(s => s.pageIndex === currentPage);
    const signatureCount = pageFields.filter(f => f.type === 'signature').length;
    const initialCount = pageFields.filter(f => f.type === 'initial').length;
    const textCount = pageFields.filter(f => f.type === 'text').length;

    return (
      <div className="flex h-screen overflow-hidden bg-gray-100">
        
        {/* Left Sidebar: Signature Controls */}
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">DocuGenius</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {!userSignatureUrl ? (
              <SignatureCreator 
                onComplete={(data) => {
                  setUserSignatureUrl(data.signature);
                  setUserInitialsUrl(data.initials);
                }} 
              />
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-center">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Signature</p>
                        <div className="bg-white p-2 border border-gray-100 rounded h-16 flex items-center justify-center">
                            <img src={userSignatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" />
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Initials</p>
                        <div className="bg-white p-2 border border-gray-100 rounded h-16 flex items-center justify-center">
                            <img src={userInitialsUrl || ''} alt="Initials" className="max-w-full max-h-full object-contain" />
                        </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                        setUserSignatureUrl(null);
                        setUserInitialsUrl(null);
                    }}
                    className="text-xs text-primary hover:text-indigo-700 underline"
                  >
                    Change Signature
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Wand2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 text-sm">AI Assistant</h4>
                      <div className="text-xs text-blue-700 mt-1 space-y-1">
                        <p>Detected on this page:</p>
                        <div className="flex gap-2 flex-wrap">
                          <span className="flex items-center gap-1"><PenTool size={10} /> <b>{signatureCount}</b> Sig.</span>
                          <span className="flex items-center gap-1"><Stamp size={10} /> <b>{initialCount}</b> Init.</span>
                          <span className="flex items-center gap-1"><Type size={10} /> <b>{textCount}</b> Text</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => detectFieldsForPage(currentPage, pageData)}
                        className="mt-3 text-xs font-medium text-blue-600 bg-white px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 flex items-center gap-1"
                        disabled={detectingPage}
                      >
                        {detectingPage ? 'Scanning...' : 'Re-scan Page'} <RefreshCcw size={10} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600">
                  <p className="mb-2 font-medium text-gray-900">Instructions:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Click <span className="text-indigo-600 font-medium">blue boxes</span> to type text.</li>
                    <li>Click <span className="text-green-600 font-medium">green boxes</span> to apply your signature or initials.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <Button 
              className="w-full justify-center" 
              onClick={handleDownload}
              isLoading={isProcessing}
            >
              <Download size={18} /> Download PDF
            </Button>
          </div>
        </div>

        {/* Main Content: Document Preview */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Toolbar */}
          <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-500">Page {currentPage + 1} of {pages.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => {
                  const next = Math.min(pages.length - 1, currentPage + 1);
                  setCurrentPage(next);
                   const nextFields = fields.filter(f => f.pageIndex === next);
                   if (nextFields.length === 0 && next !== currentPage) {
                     detectFieldsForPage(next, pages[next]);
                   }
                }}
                disabled={currentPage === pages.length - 1}
                className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center relative">
            <div className="relative shadow-2xl transition-all duration-300 ease-in-out" style={{ width: 'fit-content', height: 'fit-content' }}>
              
              {/* The Document Image */}
              <img 
                src={pageData.imageUrl} 
                alt={`Page ${currentPage + 1}`} 
                className="max-w-none"
                style={{ height: 'auto', maxHeight: 'none' }} 
              />

              {/* Overlay Layer */}
              <div className="absolute inset-0 z-10">
                 {pageFields.map((field) => {
                   const top = `${field.box.ymin / 10}%`;
                   const left = `${field.box.xmin / 10}%`;
                   const width = `${(field.box.xmax - field.box.xmin) / 10}%`;
                   const height = `${(field.box.ymax - field.box.ymin) / 10}%`;
                   
                   const isSignatureType = field.type === 'signature';
                   const isInitialType = field.type === 'initial';
                   const isInteractive = isSignatureType || isInitialType;

                   return (
                     <div
                        key={field.id}
                        className={`absolute transition-all duration-200 group
                          ${isInteractive 
                            ? (field.value ? 'border-transparent' : 'border-2 border-dashed border-green-500 bg-green-500/10 hover:bg-green-500/20')
                            : (field.value ? 'border-transparent' : 'border border-blue-400 bg-blue-400/10 hover:bg-blue-400/20')
                          }
                        `}
                        style={{ top, left, width, height }}
                     >
                       {isInteractive ? (
                         // SIGNATURE/INITIAL FIELD LOGIC
                         <div 
                           className="w-full h-full cursor-pointer"
                           onClick={() => toggleSignature(field.id, isInitialType ? 'initial' : 'signature')}
                         >
                           {field.value ? (
                             <div className="w-full h-full relative">
                               <img src={field.value} alt={field.type} className="w-full h-full object-contain" />
                               {/* X button to remove */}
                               <button className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20">
                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                   <line x1="18" y1="6" x2="6" y2="18"></line>
                                   <line x1="6" y1="6" x2="18" y2="18"></line>
                                 </svg>
                               </button>
                             </div>
                           ) : (
                             <div className="w-full h-full flex items-center justify-center">
                               <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                 {isInitialType ? 'Initial' : 'Sign'}
                               </span>
                             </div>
                           )}
                         </div>
                       ) : (
                         // TEXT FIELD LOGIC
                         <input 
                            type="text"
                            value={field.value}
                            onChange={(e) => updateTextField(field.id, e.target.value)}
                            className="w-full h-full bg-transparent border-none outline-none p-1 text-gray-900 font-sans focus:bg-white/90 focus:ring-1 focus:ring-blue-500 rounded-sm"
                            style={{ 
                              fontSize: 'min(max(12px, 1.5cqh), 20px)', // Experimental fluid sizing
                              resize: 'none'
                            }}
                            placeholder="Type here..."
                         />
                       )}
                     </div>
                   );
                 })}
              </div>

              {detectingPage && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-30">
                  <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                    <Wand2 size={16} className="text-primary" />
                    <span className="text-sm font-medium text-gray-700">Detecting fields...</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {appState === AppState.UPLOAD ? (
        <div className="flex-1 flex flex-col justify-center py-12">
          {renderUploadState()}
        </div>
      ) : (
        renderWorkspace()
      )}
    </div>
  );
};

export default App;