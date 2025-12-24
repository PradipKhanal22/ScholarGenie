
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Lightbulb, 
  BookOpen, 
  FileText, 
  MonitorPlay, 
  Code, 
  Layers, 
  GraduationCap,
  Menu,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  FileDown,
  History,
  Trash2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link,
  Upload,
  ExternalLink,
  Settings2,
  Info,
  FileBadge
} from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Prism from 'prismjs';
import { Department, OutputType, ProjectRequest, GeneratedContent, PlagiarismResult } from './types';
import { generateAcademicContent, checkPlagiarism } from './services/geminiService';

// -- Syntax Highlighting Setup --
Prism.languages.python = {
  'comment': /#.*/,
  'string': {
    pattern: /("|')(?:\\[\s\S]|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'keyword': /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
  'boolean': /\b(?:True|False|None)\b/,
  'number': /\b0x[\da-f]+\b|(?:\b\d+\.?\d*|\B\.\d+)(?:e[+-]?\d+)?/i,
  'operator': /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
  'punctuation': /[{}[\];(),.:]/
};

const getGrammar = (lang: string) => {
  const normalized = lang.toLowerCase();
  if (normalized === 'python' || normalized === 'py') return Prism.languages.python;
  if (normalized === 'javascript' || normalized === 'js' || normalized === 'jsx' || normalized === 'ts' || normalized === 'tsx') return Prism.languages.javascript;
  if (normalized === 'html' || normalized === 'xml' || normalized === 'svg') return Prism.languages.markup;
  if (normalized === 'css') return Prism.languages.css;
  if (['java', 'c', 'cpp', 'c#', 'cs', 'php', 'laravel'].includes(normalized)) return Prism.languages.clike || Prism.languages.javascript;
  return Prism.languages.plaintext;
};

interface NavItemProps { 
  active: boolean; 
  label: string; 
  icon: React.ElementType; 
  onClick: () => void; 
}

const NavItem: React.FC<NavItemProps> = ({ active, label, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="font-medium">{label}</span>
  </button>
);

interface MarkdownRendererProps {
  content: string;
  className?: string;
  mode?: 'document' | 'slide' | 'pdf';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, mode = 'document' }) => {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let language = '';
  const isSlide = mode === 'slide' || mode === 'pdf';

  const styles = {
    h1: isSlide 
      ? "text-4xl md:text-5xl font-extrabold text-slate-900 mb-10 pb-6 border-b border-slate-200 tracking-tight leading-tight" 
      : "text-3xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2",
    h2: isSlide 
      ? "text-3xl md:text-4xl font-bold text-indigo-700 mt-8 mb-6 leading-snug" 
      : "text-2xl font-bold text-slate-800 mt-6 mb-3",
    h3: isSlide
      ? "text-2xl md:text-3xl font-semibold text-slate-800 mt-6 mb-4"
      : "text-xl font-semibold text-slate-800 mt-5 mb-2",
    p: isSlide
      ? "mb-5 text-slate-600 text-xl md:text-2xl leading-relaxed font-medium"
      : "mb-2 text-slate-700 leading-relaxed",
    li: isSlide
      ? "ml-2 mb-3 pl-8 relative text-slate-700 text-xl md:text-2xl leading-relaxed before:content-[''] before:absolute before:left-0 before:top-[0.6em] before:w-2.5 before:h-2.5 before:bg-indigo-500 before:rounded-sm"
      : "ml-4 list-disc text-slate-700 mb-1 pl-1",
    strong: "font-bold text-slate-900",
    codeBlockContainer: isSlide ? "my-8 text-lg shadow-xl border-slate-800" : "my-6 text-sm",
    fileLabel: isSlide ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"
  };

  const renderCodeBlock = (code: string[], lang: string, index: number) => {
    const fullCode = code.join('\n');
    const grammar = getGrammar(lang);
    const highlighted = Prism.highlight(fullCode, grammar, lang);
    return (
      <div key={`code-${index}`} className={`${styles.codeBlockContainer} rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e1e] shadow-lg`}>
        {lang && (
          <div className="px-4 py-1.5 bg-[#2d2d2d] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center text-xs">
            <span className="uppercase">{lang}</span>
            <span className="text-slate-500">Read-only</span>
          </div>
        )}
        <div className="relative overflow-auto max-h-[500px]" tabIndex={0} role="region">
           <div className="flex min-w-full font-mono leading-6">
              <div className="sticky left-0 flex flex-col items-end px-3 py-4 text-right select-none bg-[#1e1e1e] border-r border-slate-700/50 text-[#6e7681] z-10">
                {code.map((_, i) => <div key={i}>{i + 1}</div>)}
              </div>
              <pre className="flex-1 m-0 p-4 bg-transparent overflow-visible">
                <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
              </pre>
           </div>
        </div>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(renderCodeBlock(codeBuffer, language, i));
        codeBuffer = [];
        inCodeBlock = false;
        language = '';
      } else {
        inCodeBlock = true;
        language = line.trim().replace('```', '');
      }
      continue;
    }
    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }
    if (line.startsWith('# ')) elements.push(<h1 key={i} className={styles.h1}>{line.replace('# ', '')}</h1>);
    else if (line.startsWith('## ')) elements.push(<h2 key={i} className={styles.h2}>{line.replace('## ', '')}</h2>);
    else if (line.startsWith('### ')) elements.push(<h3 key={i} className={styles.h3}>{line.replace('### ', '')}</h3>);
    else if (line.startsWith('**') && line.endsWith('**')) elements.push(<strong key={i} className={`block mt-3 mb-1 ${styles.strong}`}>{line.replace(/\*\*/g, '')}</strong>);
    else if (line.startsWith('- ')) elements.push(<li key={i} className={styles.li}>{line.replace('- ', '').replace(/\*\*/g, '')}</li>);
    else if (line.match(/^\d+\. /)) elements.push(<li key={i} className={styles.li}>{line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '')}</li>);
    else if (line.startsWith('File: ')) elements.push(<div key={i} className="mt-6 mb-2 flex items-center gap-2"><span className={`font-mono font-bold text-indigo-600 bg-indigo-50 rounded-md border border-indigo-100 shadow-sm ${styles.fileLabel}`}>{line}</span></div>);
    else if (line.trim() === '') elements.push(<div key={i} className={isSlide ? "h-6" : "h-3"}></div>);
    else elements.push(<p key={i} className={styles.p}>{line.replace(/\*\*/g, '')}</p>);
  }
  if (inCodeBlock && codeBuffer.length > 0) elements.push(renderCodeBlock(codeBuffer, language, 999));

  return (
    <div className={`prose prose-slate max-w-none ${className || ''} ${isSlide ? '' : 'prose-academic'}`}>
       <div className={`whitespace-pre-wrap ${isSlide ? '' : 'text-slate-800'}`}>{elements}</div>
    </div>
  );
};

const SlideDeck: React.FC<{ content: string }> = ({ content }) => {
  const rawSlides = content.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setCurrent(prev => Math.max(0, prev - 1));
      else if (e.key === 'ArrowRight') setCurrent(prev => Math.min(rawSlides.length - 1, prev + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rawSlides.length]);

  if (rawSlides.length === 0) return (
    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">
      <p>No slide structure detected. Please regenerate the content.</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto w-full py-4">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .slide-enter { animation: slideInRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
      `}</style>
      <div className="w-full aspect-video bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden flex flex-col relative">
        <div className="absolute top-0 left-0 right-0 h-2 bg-indigo-600 z-10"></div>
        <div key={current} className="flex-1 overflow-y-auto px-16 py-12 md:px-24 md:py-16 bg-white slide-enter flex flex-col">
          <div className="my-auto min-h-min"><MarkdownRenderer content={rawSlides[current]} mode="slide" /></div>
        </div>
        <div className="bg-white border-t border-slate-100 px-12 py-6 flex justify-between items-center text-sm text-slate-400 font-medium">
             <span className="uppercase tracking-widest text-xs font-bold text-slate-300">ScholarGenie</span>
             <span className="font-mono">{current + 1} / {rawSlides.length}</span>
        </div>
      </div>
      <div className="flex items-center space-x-8 mt-8">
        <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="p-4 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transform hover:scale-105 transition-all"><ChevronLeft className="w-6 h-6" /></button>
        <div className="flex space-x-2.5 hidden md:flex">
            {rawSlides.map((_, idx) => <div key={idx} className={`h-2 rounded-full transition-all duration-500 ${idx === current ? 'bg-indigo-600 w-8' : 'bg-slate-300 w-2'}`} />)}
        </div>
        <button onClick={() => setCurrent(Math.min(rawSlides.length - 1, current + 1))} disabled={current === rawSlides.length - 1} className="p-4 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 transform hover:scale-105 transition-all"><ChevronRight className="w-6 h-6" /></button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OutputType>(OutputType.IDEA);
  const [department, setDepartment] = useState<string>(Department.CS);
  const [topic, setTopic] = useState<string>('');
  const [context, setContext] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  
  // Plagiarism State
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismResult | null>(null);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [showScanConfig, setShowScanConfig] = useState(false);
  const [scanRefs, setScanRefs] = useState<string[]>([]);
  const [currentRefInput, setCurrentRefInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<GeneratedContent[]>(() => {
    try {
      const saved = localStorage.getItem('scholarGenieHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => { localStorage.setItem('scholarGenieHistory', JSON.stringify(history)); }, [history]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isFullScreen) setIsFullScreen(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const handleGenerate = async () => {
    if (!topic.trim()) { alert("Please enter a topic."); return; }
    setLoading(true);
    setResult(null);
    setPlagiarismResult(null);
    setIsFullScreen(false);
    const content = await generateAcademicContent({ department, topic, outputType: activeTab, additionalContext: context });
    const newContent: GeneratedContent = { id: crypto.randomUUID(), type: activeTab, content, timestamp: Date.now(), topic, department, additionalContext: context };
    setResult(newContent);
    setHistory(prev => [newContent, ...prev]);
    setLoading(false);
  };

  const handleCheckPlagiarism = async () => {
    if (!result) return;
    setCheckingPlagiarism(true);
    const comparisonContext = scanRefs.join('\n\n');
    const data = await checkPlagiarism(result.content, comparisonContext);
    const updatedContent = { ...result, plagiarismResult: data };
    setResult(updatedContent);
    setHistory(prev => prev.map(item => item.id === result.id ? updatedContent : item));
    setPlagiarismResult(data);
    setShowScanConfig(false);
    setShowPlagiarismModal(true);
    setCheckingPlagiarism(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (re) => {
        const text = re.target?.result as string;
        if (text) setScanRefs(prev => [...prev, `[Uploaded File: ${file.name}]\n${text}`]);
      };
      reader.readAsText(file);
    });
  };

  const handleAddRef = () => {
    if (currentRefInput.trim()) {
      setScanRefs(prev => [...prev, currentRefInput]);
      setCurrentRefInput('');
    }
  };

  const handleRestoreHistory = (item: GeneratedContent) => {
    setResult(item);
    setActiveTab(item.type);
    if(item.topic) setTopic(item.topic);
    if(item.department) setDepartment(item.department);
    if(item.additionalContext) setContext(item.additionalContext);
    setPlagiarismResult(item.plagiarismResult || null);
    setIsFullScreen(false);
  };

  const handleDownload = async () => {
    if (!result) return;
    if (result.type === OutputType.CODE) {
      const zip = new JSZip();
      const files: { name: string; content: string }[] = [];
      const lines = result.content.split('\n');
      let currentFile = '', currentContent: string[] = [], capture = false, foundFiles = false;
      for (const line of lines) {
        if (line.startsWith('File: ')) {
          if (currentFile && currentContent.length > 0) files.push({ name: currentFile, content: currentContent.join('\n') });
          currentFile = line.replace('File: ', '').trim();
          currentContent = []; foundFiles = true; capture = false;
        } else if (line.trim().startsWith('```') && currentFile) {
          if (!capture) capture = true; else {
            capture = false;
            if (currentFile && currentContent.length > 0) { files.push({ name: currentFile, content: currentContent.join('\n') }); currentFile = ''; currentContent = []; }
          }
        } else if (capture) currentContent.push(line);
      }
      if (foundFiles && files.length > 0) {
        files.forEach(f => zip.file(f.name, f.content));
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content); link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_code.zip`; link.click(); return;
      }
    }
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}.md`; link.click();
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setIsPdfGenerating(true);
    try {
      // Create a temporary hidden container for PDF rendering
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1200px'; // High resolution width
      document.body.appendChild(container);
      const root = ReactDOM.createRoot(container);

      const doc = new jsPDF({
        orientation: result.type === OutputType.SLIDES ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      if (result.type === OutputType.SLIDES) {
        const rawSlides = result.content.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
        
        for (let i = 0; i < rawSlides.length; i++) {
          if (i > 0) doc.addPage('a4', 'landscape');
          
          await new Promise<void>(resolve => {
            root.render(
              <div style={{ 
                width: '1122px', 
                height: '794px', 
                background: 'white', 
                padding: '80px', 
                display: 'flex', 
                flexDirection: 'column',
                boxSizing: 'border-box'
              }} className="prose-academic">
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '8px', background: '#4f46e5' }}></div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <MarkdownRenderer content={rawSlides[i]} mode="pdf" />
                </div>
                <div style={{ 
                  marginTop: 'auto', 
                  paddingTop: '30px', 
                  borderTop: '1px solid #e2e8f0', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  <span>ScholarGenie Presentation</span>
                  <span>Page {i + 1} of {rawSlides.length}</span>
                </div>
              </div>
            );
            setTimeout(resolve, 350);
          });

          const canvas = await html2canvas(container.firstChild as HTMLElement, { 
            scale: 2, // Better text quality
            useCORS: true,
            logging: false
          });
          
          doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 297, 210);
        }
      } else {
        // Standard Document PDF
        await new Promise<void>(resolve => {
          root.render(
            <div style={{ 
              width: '800px', 
              padding: '60px', 
              background: 'white',
              boxSizing: 'border-box'
            }} className="prose-academic">
              <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>{topic}</h1>
                <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>{department} • Generated on {new Date().toLocaleDateString()}</p>
              </div>
              <MarkdownRenderer content={result.content} />
              <div style={{ 
                marginTop: '60px', 
                paddingTop: '20px', 
                borderTop: '1px solid #f1f5f9',
                fontSize: '10px',
                color: '#cbd5e1',
                textAlign: 'center'
              }}>
                This document was generated by ScholarGenie AI Assistant.
              </div>
            </div>
          );
          setTimeout(resolve, 600);
        });

        const canvas = await html2canvas(container.firstChild as HTMLElement, { 
          scale: 2,
          useCORS: true,
          logging: false
        });

        const imgWidth = 210; 
        const pageHeight = 297; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight; 
        let position = 0;

        doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      }

      doc.save(`${topic.replace(/\s+/g, '_').toLowerCase()}_ScholarGenie.pdf`);
      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error generating PDF. Please check console for details.");
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const navItems = [
    { type: OutputType.IDEA, label: 'Idea Generator', icon: Lightbulb },
    { type: OutputType.DOCS, label: 'Documentation', icon: BookOpen },
    { type: OutputType.REPORT, label: 'Academic Report', icon: FileText },
    { type: OutputType.SLIDES, label: 'Presentation', icon: MonitorPlay },
    { type: OutputType.CODE, label: 'Code Assistant', icon: Code },
    { type: OutputType.ALL, label: 'Full Suite', icon: Layers },
    { type: OutputType.HISTORY, label: 'History', icon: History }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {mobileMenuOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

      {/* Advanced Scan Configuration Modal */}
      {showScanConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowScanConfig(false)} />
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  Configure Plagiarism Scan
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">Add reference materials for targeted comparison.</p>
              </div>
              <button onClick={() => setShowScanConfig(false)} className="p-2 hover:bg-slate-200 rounded-full transition"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-indigo-500" />
                  Compare against URL or Text
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={currentRefInput} 
                    onChange={e => setCurrentRefInput(e.target.value)} 
                    placeholder="Paste URL, title, or specific text snippet..." 
                    className="flex-1 rounded-lg border-slate-300 border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={handleAddRef} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition">Add</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-indigo-500" />
                  Reference Documents (.txt)
                </label>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition flex flex-col items-center justify-center group"
                >
                  <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 mb-2" />
                  <span className="text-sm font-medium text-slate-500 group-hover:text-indigo-600">Click to upload files for comparison</span>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".txt" />
                </button>
              </div>

              {scanRefs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Added References ({scanRefs.length})</h4>
                  <div className="space-y-2">
                    {scanRefs.map((ref, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                        <span className="text-xs text-slate-600 line-clamp-1 font-medium">{ref}</span>
                        <button onClick={() => setScanRefs(prev => prev.filter((_, i) => i !== idx))} className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                Providing specific URLs or materials significantly improves the accuracy of the cross-referencing scan.
              </div>
              <button 
                onClick={handleCheckPlagiarism}
                disabled={checkingPlagiarism}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {checkingPlagiarism ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Scanning...</> : <><ShieldCheck className="w-5 h-5" /> Start Advanced Scan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Plagiarism Result Modal */}
      {showPlagiarismModal && plagiarismResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlagiarismModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className={`p-6 text-white flex justify-between items-start ${plagiarismResult.score < 25 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : plagiarismResult.score < 50 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="w-6 h-6" /> Originality Report</h3>
                <p className="text-white/80 text-sm mt-1">Advanced Similarity Assessment Completed</p>
              </div>
              <button onClick={() => setShowPlagiarismModal(false)} className="text-white/80 hover:text-white p-1 bg-black/10 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[75vh]">
              <div className="flex items-center gap-8 mb-8 pb-8 border-b border-slate-100">
                <div className="relative">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                    <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={351} strokeDashoffset={351 - (351 * plagiarismResult.score) / 100} className={`transition-all duration-1000 ${plagiarismResult.score < 25 ? 'text-green-500' : plagiarismResult.score < 50 ? 'text-yellow-500' : 'text-red-500'}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-extrabold text-slate-800">{plagiarismResult.score}%</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Similarity</span></div>
                </div>
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 ${plagiarismResult.score < 25 ? 'bg-green-100 text-green-700' : plagiarismResult.score < 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {plagiarismResult.score < 25 ? <CheckCircle className="w-3.5 h-3.5" /> : plagiarismResult.score < 50 ? <AlertTriangle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {plagiarismResult.score < 25 ? 'Highly Original' : plagiarismResult.score < 50 ? 'Moderately Original' : 'Significant Overlap'}
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed max-w-xs">Our advanced engine cross-referenced provided sources and public knowledge to determine this rating.</p>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Analysis Summary
                </h4>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100"><p className="text-slate-700 text-sm leading-relaxed italic">"{plagiarismResult.analysis}"</p></div>
              </div>

              {plagiarismResult.flaggedSources && plagiarismResult.flaggedSources.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" /> Flagged Potential Sources
                  </h4>
                  <div className="space-y-3">
                    {plagiarismResult.flaggedSources.map((src, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition shadow-sm group">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-sm font-bold text-slate-800 truncate" title={src.title}>{src.title}</p>
                          {src.url && <p className="text-xs text-indigo-500 truncate mt-0.5">{src.url}</p>}
                        </div>
                        <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${
                          src.matchLevel === 'High' ? 'bg-red-50 text-red-600 border-red-100' : 
                          src.matchLevel === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          {src.matchLevel} Match
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400">Results are stored in your project history for later review.</p>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isFullScreen ? 'hidden lg:hidden' : ''}`}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-700"><GraduationCap className="w-8 h-8" /><span className="text-xl font-bold tracking-tight">ScholarGenie</span></div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden text-slate-400"><X className="w-6 h-6" /></button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => <NavItem key={item.type} active={activeTab === item.type} label={item.label} icon={item.icon} onClick={() => { setActiveTab(item.type); setMobileMenuOpen(false); setResult(null); setPlagiarismResult(null); setIsFullScreen(false); }} />)}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Mentor's Note</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">AI assistance for learning. Verify all results independently.</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!isFullScreen && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600"><Menu className="w-6 h-6" /></button>
            <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">{navItems.find(i => i.type === activeTab)?.label}</h1>
            <div className="flex items-center space-x-4"><span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">Gemini 3 Active</span></div>
          </header>
        )}

        <div className={`flex-1 overflow-y-auto ${isFullScreen ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div className={`mx-auto h-full ${isFullScreen ? 'w-full' : 'max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6'}`}>
            {activeTab === OutputType.HISTORY ? (
              <div className="lg:col-span-12 h-full">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                  <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2"><History className="w-5 h-5 text-indigo-500" /> Generated History</h2>
                    <span className="text-sm text-slate-500">{history.length} items</span>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {history.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20"><History className="w-12 h-12 mb-4 opacity-20" /><p>No history yet.</p></div> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                           <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
                              <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                   <div className="flex gap-2 items-center flex-wrap">
                                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">{item.type}</span>
                                     {item.plagiarismResult && <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.plagiarismResult.score < 25 ? 'bg-green-50 text-green-700 border-green-200' : item.plagiarismResult.score < 50 ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{item.plagiarismResult.score}% Sim.</span>}
                                   </div>
                                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Delete item?")) setHistory(prev => prev.filter(i => i.id !== item.id)); }} className="text-slate-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1 line-clamp-2">{item.topic || "Untitled"}</h3>
                                <p className="text-xs text-slate-500 mb-4">{item.department}</p>
                                <p className="text-sm text-slate-600 line-clamp-3">{item.additionalContext || "No additional context."}</p>
                              </div>
                              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center text-xs text-slate-500">
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1.5" />{new Date(item.timestamp).toLocaleDateString()}</span>
                                <button onClick={() => handleRestoreHistory(item)} className="flex items-center text-indigo-600 font-medium">View <ArrowRight className="w-3 h-3 ml-1" /></button>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {!isFullScreen && (
                  <div className="lg:col-span-4 space-y-6 h-fit">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center"><Sparkles className="w-4 h-4 mr-2 text-indigo-500" /> Configure Request</h2>
                      <div className="space-y-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Department</label><select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm outline-none">{Object.values(Department).map((dept) => <option key={dept} value={dept}>{dept}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Topic</label><input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. E-commerce, AI Chatbot" className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500" /></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Context</label><textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Use Python, focus on security..." className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm h-24 outline-none focus:ring-1 focus:ring-indigo-500 resize-none" /></div>
                        <button onClick={handleGenerate} disabled={loading} className={`w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-all ${loading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200'}`}>{loading ? <> <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-4 h-4 mr-2"></span> Generating...</> : <> <Sparkles className="w-5 h-5" /> <span>Generate Content</span> </>}</button>
                      </div>
                    </div>
                  </div>
                )}
                <div className={`${isFullScreen ? 'w-full h-full' : 'lg:col-span-8 h-full min-h-[500px]'}`}>
                  <div className={`bg-white shadow-sm border border-slate-200 h-full flex flex-col ${isFullScreen ? 'rounded-none border-0' : 'rounded-xl'}`}>
                    <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h2 className="font-semibold text-slate-800 flex items-center">Generated Output</h2>
                      <div className="flex items-center space-x-2">
                        {result && (
                          <>
                            <button 
                              onClick={handleDownloadPDF} 
                              disabled={isPdfGenerating} 
                              className="flex items-center text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                              title="Download as PDF"
                            >
                              {isPdfGenerating ? (
                                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-1.5"></span>
                              ) : (
                                <FileDown className="w-3.5 h-3.5 mr-1.5" />
                              )} 
                              PDF
                            </button>
                            <button onClick={() => navigator.clipboard.writeText(result.content)} className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-md transition">Copy</button>
                            <button onClick={() => { setShowScanConfig(true); setScanRefs([]); }} disabled={checkingPlagiarism} className="flex items-center text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Scan</button>
                            {(activeTab === OutputType.CODE || activeTab === OutputType.SLIDES) && <button onClick={handleDownload} className="flex items-center text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition"><Download className="w-3 h-3 mr-1.5" /> {activeTab === OutputType.CODE ? 'ZIP' : 'Slides'}</button>}
                          </>
                        )}
                        {result && <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-1.5 text-slate-500 hover:bg-indigo-50 rounded-md transition ml-2">{isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</button>}
                      </div>
                    </div>
                    <div className={`p-6 flex-1 overflow-y-auto custom-scrollbar ${isFullScreen ? 'h-[calc(100vh-60px)]' : 'max-h-[calc(100vh-250px)]'}`}>
                      {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div><p className="animate-pulse">Consulting the digital library...</p></div>
                      ) : result ? (
                        activeTab === OutputType.SLIDES ? <SlideDeck key={result.timestamp} content={result.content} /> : <MarkdownRenderer content={result.content} />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-8">
                          <MonitorPlay className="w-16 h-16 mb-4 opacity-10" />
                          <p className="text-lg font-medium text-slate-500 mb-2">Ready to assist!</p>
                          <p className="text-sm max-w-sm">Enter project details and select an output type to start your academic journey.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
