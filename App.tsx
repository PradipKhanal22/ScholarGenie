import React, { useState, useEffect } from 'react';
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
  XCircle
} from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Prism from 'prismjs';
import { Department, OutputType, ProjectRequest, GeneratedContent, PlagiarismResult } from './types';
import { generateAcademicContent, checkPlagiarism } from './services/geminiService';

// -- Syntax Highlighting Setup --
// Define Python grammar manually to ensure availability without external component loading risks
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

// Map other common languages to existing grammars or sensible defaults
const getGrammar = (lang: string) => {
  const normalized = lang.toLowerCase();
  if (normalized === 'python' || normalized === 'py') return Prism.languages.python;
  if (normalized === 'javascript' || normalized === 'js' || normalized === 'jsx' || normalized === 'ts' || normalized === 'tsx') return Prism.languages.javascript;
  if (normalized === 'html' || normalized === 'xml' || normalized === 'svg') return Prism.languages.markup;
  if (normalized === 'css') return Prism.languages.css;
  // Fallbacks for C-style languages
  if (['java', 'c', 'cpp', 'c#', 'cs', 'php', 'laravel'].includes(normalized)) return Prism.languages.clike || Prism.languages.javascript;
  return Prism.languages.plaintext;
};

interface NavItemProps { 
  active: boolean; 
  label: string; 
  icon: React.ElementType; 
  onClick: () => void; 
}

// Sidebar Item Component
const NavItem: React.FC<NavItemProps> = ({ 
  active, 
  label, 
  icon: Icon, 
  onClick 
}) => (
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
  mode?: 'document' | 'slide';
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, mode = 'document' }) => {
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let language = '';

  const isSlide = mode === 'slide';

  // Styling configurations based on mode
  const styles = {
    h1: isSlide 
      ? "text-4xl md:text-5xl font-bold text-indigo-900 mb-8 pb-6 border-b-4 border-indigo-500/20 leading-tight" 
      : "text-3xl font-bold text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2",
    h2: isSlide 
      ? "text-3xl md:text-4xl font-bold text-indigo-800 mt-8 mb-6 leading-snug" 
      : "text-2xl font-bold text-slate-800 mt-6 mb-3",
    h3: isSlide
      ? "text-2xl md:text-3xl font-semibold text-slate-800 mt-6 mb-4"
      : "text-xl font-semibold text-slate-800 mt-5 mb-2",
    p: isSlide
      ? "mb-6 text-slate-700 text-xl md:text-2xl leading-relaxed"
      : "mb-2 text-slate-700 leading-relaxed",
    li: isSlide
      ? "ml-8 list-disc text-slate-700 mb-4 pl-2 text-xl md:text-2xl leading-relaxed marker:text-indigo-500"
      : "ml-4 list-disc text-slate-700 mb-1 pl-1",
    strong: "font-bold text-slate-900",
    codeBlockContainer: isSlide ? "my-8 text-lg" : "my-6 text-sm",
    fileLabel: isSlide ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"
  };

  const renderCodeBlock = (code: string[], lang: string, index: number) => {
    const fullCode = code.join('\n');
    const grammar = getGrammar(lang);
    const highlighted = Prism.highlight(fullCode, grammar, lang);

    const blockId = `code-block-${index}`;
    const langId = `lang-${index}`;

    return (
      <div key={`code-${index}`} className={`${styles.codeBlockContainer} rounded-lg overflow-hidden border border-slate-700 bg-[#1e1e1e] shadow-lg`}>
        {lang && (
          <div className="px-4 py-1.5 bg-[#2d2d2d] font-mono text-slate-400 border-b border-slate-700 flex justify-between items-center text-xs">
            <span className="uppercase" id={langId}>{lang}</span>
            <span className="text-slate-500">Read-only</span>
          </div>
        )}
        <div 
          className="relative overflow-auto max-h-[500px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" 
          tabIndex={0}
          role="region"
          aria-labelledby={lang ? langId : undefined}
          aria-label={!lang ? "Code snippet" : undefined}
        >
           <div className="flex min-w-full font-mono leading-6">
              {/* Sticky Line Numbers */}
              <div 
                className="sticky left-0 flex flex-col items-end px-3 py-4 text-right select-none bg-[#1e1e1e] border-r border-slate-700/50 text-[#6e7681] z-10"
                aria-hidden="true"
              >
                {code.map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              {/* Highlighted Code */}
              <pre className="flex-1 m-0 p-4 bg-transparent overflow-visible">
                <code 
                  className={`language-${lang}`} 
                  dangerouslySetInnerHTML={{ __html: highlighted }} 
                />
              </pre>
           </div>
        </div>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block start/end
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(renderCodeBlock(codeBuffer, language, i));
        codeBuffer = [];
        inCodeBlock = false;
        language = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        language = line.trim().replace('```', '');
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Normal markdown processing
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className={styles.h1}>{line.replace('# ', '')}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className={styles.h2}>{line.replace('## ', '')}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className={styles.h3}>{line.replace('### ', '')}</h3>);
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<strong key={i} className={`block mt-3 mb-1 ${styles.strong}`}>{line.replace(/\*\*/g, '')}</strong>);
    } else if (line.startsWith('- ')) {
       elements.push(<li key={i} className={styles.li}>{line.replace('- ', '').replace(/\*\*/g, '')}</li>);
    } else if (line.match(/^\d+\. /)) {
       elements.push(<li key={i} className={styles.li}>{line.replace(/^\d+\.\s/, '').replace(/\*\*/g, '')}</li>);
    } else if (line.startsWith('File: ')) {
       elements.push(
         <div key={i} className="mt-6 mb-2 flex items-center gap-2">
            <span className={`font-mono font-bold text-indigo-600 bg-indigo-50 rounded-md border border-indigo-100 shadow-sm ${styles.fileLabel}`}>
              {line}
            </span>
         </div>
       );
    } else if (line.trim() === '') {
       elements.push(<div key={i} className={isSlide ? "h-6" : "h-3"}></div>);
    } else {
       elements.push(<p key={i} className={styles.p}>{line.replace(/\*\*/g, '')}</p>);
    }
  }

  // Handle unclosed code block (fallback)
  if (inCodeBlock && codeBuffer.length > 0) {
      elements.push(renderCodeBlock(codeBuffer, language, 999));
  }

  return (
    <div className={`prose prose-slate max-w-none ${className || ''} ${isSlide ? '' : 'prose-academic'}`}>
       <div className={`whitespace-pre-wrap ${isSlide ? '' : 'text-slate-800'}`}>
         {elements}
       </div>
    </div>
  );
};

// Slide Deck Component
const SlideDeck: React.FC<{ content: string }> = ({ content }) => {
  // Robust splitting: handle --- with newlines around it
  const rawSlides = content.split(/\n\s*---\s*\n/);
  const slides = rawSlides
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const [current, setCurrent] = useState(0);

  // Keyboard Navigation for Slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrent(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrent(prev => Math.min(slides.length - 1, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  if (slides.length === 0) return (
    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg" role="alert">
      <p>No slide structure detected. Please regenerate the content.</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-6xl mx-auto w-full py-4">
      {/* Animation Styles */}
      <style>{`
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-enter {
          animation: slideFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div 
        className="w-full aspect-video bg-white shadow-2xl rounded-xl border border-slate-200 overflow-hidden flex flex-col relative transition-all duration-300 ring-1 ring-slate-900/5"
        aria-label={`Slide ${current + 1} of ${slides.length}`}
        role="region"
      >
        {/* Slide Top Decoration */}
        <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 z-10"></div>

        {/* Slide Content Area */}
        <div 
          key={current}
          className="flex-1 overflow-y-auto p-12 md:p-16 custom-scrollbar bg-gradient-to-br from-white via-white to-slate-50 slide-enter flex flex-col justify-center" 
          aria-live="polite"
        >
           <MarkdownRenderer content={slides[current]} mode="slide" />
        </div>
        
        {/* Slide Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-4 flex justify-between items-center text-sm text-slate-500 font-medium z-10" aria-hidden="true">
             <span className="flex items-center gap-2 text-indigo-900 font-semibold">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                ScholarGenie
             </span>
             <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
               {current + 1} / {slides.length}
             </span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center space-x-8 mt-8">
        <button 
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          aria-label="Previous slide"
          className="p-4 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 transform hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex space-x-2.5 hidden md:flex" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={slides.length}>
            {slides.map((_, idx) => (
                <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all duration-500 ease-out ${idx === current ? 'bg-indigo-600 w-8 shadow-sm' : 'bg-slate-300 w-2'}`}
                />
            ))}
        </div>

        <button 
          onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))}
          disabled={current === slides.length - 1}
          aria-label="Next slide"
          className="p-4 rounded-full bg-white shadow-lg border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 transform hover:scale-105 active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
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

  // History State
  const [history, setHistory] = useState<GeneratedContent[]>(() => {
    try {
      const saved = localStorage.getItem('scholarGenieHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load history", e);
      return [];
    }
  });

  // Save history on change
  useEffect(() => {
    localStorage.setItem('scholarGenieHistory', JSON.stringify(history));
  }, [history]);

  // Handle Escape key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic or technology focus.");
      return;
    }

    setLoading(true);
    setResult(null);
    setIsFullScreen(false); // Reset full screen on new generation

    const request: ProjectRequest = {
      department,
      topic,
      outputType: activeTab,
      additionalContext: context
    };

    const content = await generateAcademicContent(request);
    
    const newContent: GeneratedContent = {
      id: crypto.randomUUID(),
      type: activeTab,
      content,
      timestamp: Date.now(),
      topic,
      department,
      additionalContext: context
    };

    setResult(newContent);
    
    // Add to history (prepend)
    setHistory(prev => [newContent, ...prev]);

    setLoading(false);
  };

  const handleCheckPlagiarism = async () => {
    if (!result) return;
    setCheckingPlagiarism(true);
    const data = await checkPlagiarism(result.content);
    setPlagiarismResult(data);
    setShowPlagiarismModal(true);
    setCheckingPlagiarism(false);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("Are you sure you want to delete this item?")) {
       setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleRestoreHistory = (item: GeneratedContent) => {
    setResult(item);
    setActiveTab(item.type);
    if(item.topic) setTopic(item.topic);
    if(item.department) setDepartment(item.department);
    if(item.additionalContext) setContext(item.additionalContext);
    setIsFullScreen(false);
  };

  const handleDownload = async () => {
    if (!result) return;

    if (result.type === OutputType.CODE) {
      // Attempt to zip files
      const zip = new JSZip();
      const files: { name: string; content: string }[] = [];
      const lines = result.content.split('\n');
      
      let currentFile = '';
      let currentContent: string[] = [];
      let capture = false;
      let foundFiles = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('File: ')) {
          // Save previous file if exists
          if (currentFile && currentContent.length > 0) {
            files.push({ name: currentFile, content: currentContent.join('\n') });
          }
          currentFile = line.replace('File: ', '').trim();
          currentContent = [];
          foundFiles = true;
          capture = false; // Wait for code block
        } else if (line.trim().startsWith('```') && currentFile) {
           if (!capture) {
             capture = true; // Start capturing
           } else {
             capture = false; // End capturing
             // Push file immediately when block closes
             if (currentFile && currentContent.length > 0) {
                files.push({ name: currentFile, content: currentContent.join('\n') });
                currentFile = '';
                currentContent = [];
             }
           }
        } else if (capture) {
          currentContent.push(line);
        }
      }

      if (foundFiles && files.length > 0) {
        files.forEach(f => zip.file(f.name, f.content));
        try {
          const content = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(content);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_code.zip`;
          link.click();
          URL.revokeObjectURL(url);
          return;
        } catch (e) {
          console.error("Zip generation failed, falling back to text file", e);
        }
      }
    }

    // Default download as text/markdown
    const blob = new Blob([result.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_${result.type.toLowerCase().replace(/\s/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setIsPdfGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: result.type === OutputType.SLIDES ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Create a temporary container for rendering content to capture
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.zIndex = '-100';
      document.body.appendChild(container);

      if (result.type === OutputType.SLIDES) {
        const rawSlides = result.content.split(/\n\s*---\s*\n/).map(s => s.trim()).filter(s => s.length > 0);
        
        // Slide dimensions for A4 Landscape approx 297mm x 210mm
        // We render at high pixel density for quality
        const width = 1122; // px at approx 96dpi for A4 width
        const height = 794; // px

        for (let i = 0; i < rawSlides.length; i++) {
          if (i > 0) doc.addPage();

          // Render slide content to DOM
          const root = ReactDOM.createRoot(container);
          
          await new Promise<void>((resolve) => {
             // Render a slide-like view
             root.render(
               <div style={{ width: `${width}px`, height: `${height}px`, background: 'white', padding: '60px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }} className="prose-academic">
                  {/* Decorative Bar for PDF */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10px', background: '#4f46e5' }}></div>
                  
                  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {/* Use mode="slide" for large fonts in PDF */}
                    <MarkdownRenderer content={rawSlides[i]} mode="slide" className="max-w-none" />
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                    <span style={{color: '#312e81'}}>ScholarGenie • {department}</span>
                    <span>{i + 1} / {rawSlides.length}</span>
                  </div>
               </div>
             );
             // Give React a moment to render
             setTimeout(resolve, 200);
          });

          // Capture
          const canvas = await html2canvas(container.firstChild as HTMLElement, {
            scale: 1.5, // Better quality
            useCORS: true,
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          doc.addImage(imgData, 'PNG', 0, 0, 297, 210); // Fill A4 Landscape
          
          // Cleanup for next slide
          root.unmount();
        }

      } else {
        // Report / Docs / Other
        const root = ReactDOM.createRoot(container);
        
        // Render full doc with standard A4 width constraints
        // A4 width in px at 96dpi is ~794px. We'll use 750px for padding.
        await new Promise<void>((resolve) => {
          root.render(
            <div style={{ width: '794px', padding: '40px', background: 'white', color: '#1e293b' }}>
               <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: '#334155' }}>{topic}</h1>
               <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '30px' }}>Generated by ScholarGenie • {new Date().toLocaleDateString()}</div>
               <MarkdownRenderer content={result.content} />
            </div>
          );
          setTimeout(resolve, 500); // Wait slightly longer for long text
        });

        // Use jsPDF HTML method if possible, or html2canvas for simple image snapshot
        // html2canvas is safer for complex layout, though text isn't selectable
        const canvas = await html2canvas(container.firstChild as HTMLElement, {
          scale: 1.5,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width mm
        const pageHeight = 297; // A4 height mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          doc.addPage();
          doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        root.unmount();
      }

      // Cleanup
      document.body.removeChild(container);
      
      // Save
      doc.save(`${topic.replace(/\s+/g, '_').toLowerCase()}.pdf`);

    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Could not generate PDF. Please try again.");
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
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Plagiarism Check Modal */}
      {showPlagiarismModal && plagiarismResult && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlagiarismModal(false)} />
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative z-10 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className={`p-6 text-white flex justify-between items-start ${plagiarismResult.score < 25 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : plagiarismResult.score < 50 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-red-500 to-pink-600'}`}>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6" />
                  Originality Report
                </h3>
                <p className="text-white/80 text-sm mt-1">AI-Estimated Similarity Assessment</p>
              </div>
              <button onClick={() => setShowPlagiarismModal(false)} className="text-white/80 hover:text-white p-1 bg-black/10 hover:bg-black/20 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center">
              {/* Score Indicator */}
              <div className="relative mb-6">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke="currentColor" strokeWidth="12" 
                    fill="transparent" 
                    strokeDasharray={440} 
                    strokeDashoffset={440 - (440 * plagiarismResult.score) / 100} 
                    className={`transition-all duration-1000 ease-out ${plagiarismResult.score < 25 ? 'text-green-500' : plagiarismResult.score < 50 ? 'text-yellow-500' : 'text-red-500'}`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl font-bold text-slate-800">{plagiarismResult.score}%</span>
                   <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Similarity</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className={`mb-6 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 ${plagiarismResult.score < 25 ? 'bg-green-100 text-green-700' : plagiarismResult.score < 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
                {plagiarismResult.score < 25 ? <CheckCircle className="w-4 h-4" /> : plagiarismResult.score < 50 ? <AlertTriangle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {plagiarismResult.score < 25 ? 'Highly Original' : plagiarismResult.score < 50 ? 'Moderately Original' : 'Significant Overlap Likely'}
              </div>

              <div className="bg-slate-50 rounded-lg p-5 w-full border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Detailed Analysis</h4>
                <p className="text-slate-700 text-sm leading-relaxed">{plagiarismResult.analysis}</p>
              </div>

              <div className="mt-6 text-xs text-center text-slate-400 max-w-xs">
                * This score is an AI estimation based on common phrasing patterns and does not guarantee results from paid plagiarism databases like Turnitin.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Hidden in Full Screen Mode */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isFullScreen ? 'hidden lg:hidden' : ''}
      `}
      aria-label="Sidebar navigation"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-indigo-700">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-bold tracking-tight">ScholarGenie</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="lg:hidden text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.type}
              active={activeTab === item.type}
              label={item.label}
              icon={item.icon}
              onClick={() => {
                setActiveTab(item.type);
                setMobileMenuOpen(false);
                setResult(null); 
                setIsFullScreen(false);
              }}
            />
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
          <div className="bg-indigo-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Mentor's Note</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Always review AI-generated content for accuracy. This tool is for assistance, not replacement of your own work.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header - Hidden in Full Screen Mode */}
        {!isFullScreen && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                {navItems.find(i => i.type === activeTab)?.label}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
               <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                  Gemini 2.5 Active
               </span>
            </div>
          </header>
        )}

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto ${isFullScreen ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div className={`mx-auto h-full ${isFullScreen ? 'w-full' : 'max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6'}`}>
            
            {/* HISTORY VIEW */}
            {activeTab === OutputType.HISTORY ? (
              <div className="lg:col-span-12 h-full">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
                  <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                      <History className="w-5 h-5 text-indigo-500" />
                      Generated History
                    </h2>
                    <span className="text-sm text-slate-500">{history.length} items saved</span>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {history.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                        <div className="bg-slate-100 p-6 rounded-full">
                          <History className="w-12 h-12 text-slate-300" />
                        </div>
                        <p className="text-center max-w-sm">No history yet. Generate some content to see it listed here.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {history.map((item) => (
                           <div key={item.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group">
                              <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                     {item.type}
                                   </span>
                                   <button 
                                     onClick={(e) => handleDeleteHistory(e, item.id)}
                                     className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 opacity-0 group-hover:opacity-100"
                                     aria-label="Delete history item"
                                   >
                                     <Trash2 className="w-4 h-4" />
                                   </button>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1 line-clamp-2" title={item.topic}>{item.topic || "Untitled Project"}</h3>
                                <div className="flex items-center text-xs text-slate-500 mb-4">
                                  <span className="font-medium text-slate-600 mr-2">{item.department}</span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-3 mb-4">{item.additionalContext || "No additional context provided."}</p>
                              </div>
                              <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex justify-between items-center text-xs text-slate-500">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1.5" />
                                  {new Date(item.timestamp).toLocaleDateString()}
                                </span>
                                <button 
                                  onClick={() => handleRestoreHistory(item)}
                                  className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors focus:outline-none"
                                >
                                  View <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // STANDARD VIEW (Split Layout)
              <>
                {/* Input Section - Hidden in Full Screen Mode */}
                {!isFullScreen && (
                  <div className="lg:col-span-4 space-y-6 h-fit">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                      <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center">
                        <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
                        Configure Request
                      </h2>
                      
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="dept-select" className="block text-sm font-medium text-slate-700 mb-1">
                            Department / Field
                          </label>
                          <select
                            id="dept-select"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          >
                            {Object.values(Department).map((dept) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="topic-input" className="block text-sm font-medium text-slate-700 mb-1">
                            Topic or Technology Focus
                          </label>
                          <input
                            id="topic-input"
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. E-commerce, AI Chatbot, IoT Home"
                            className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                          />
                        </div>

                        <div>
                          <label htmlFor="context-input" className="block text-sm font-medium text-slate-700 mb-1">
                            Additional Context (Optional)
                          </label>
                          <textarea
                            id="context-input"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="e.g. Use Python/Django, focus on security, bachelor level final project..."
                            className="w-full rounded-lg border-slate-300 border bg-slate-50 px-3 py-2 text-sm h-24 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition resize-none"
                          />
                        </div>

                        <button
                          onClick={handleGenerate}
                          disabled={loading}
                          className={`w-full py-2.5 px-4 rounded-lg text-white font-medium flex items-center justify-center space-x-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 ${
                            loading 
                              ? 'bg-slate-400 cursor-not-allowed' 
                              : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg shadow-indigo-200'
                          }`}
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span>Generate Content</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tips Section */}
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-100" role="note" aria-label="Pro tips">
                      <h3 className="text-sm font-semibold text-blue-800 mb-2">Pro Tips</h3>
                      <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                        <li>Be specific about the technology stack (e.g., "MERN Stack" vs "Web").</li>
                        <li>Mention the academic level (Bachelor/Master) in context.</li>
                        <li>Review the "Literature Review" section carefully to ensure cited concepts exist.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Output Section */}
                <div className={`${isFullScreen ? 'w-full h-full' : 'lg:col-span-8 h-full min-h-[500px]'}`}>
                  <div className={`bg-white shadow-sm border border-slate-200 h-full flex flex-col ${isFullScreen ? 'rounded-none border-0' : 'rounded-xl'}`}>
                    <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h2 className="font-semibold text-slate-800 flex items-center">
                        Generated Output
                        {result && isFullScreen && <span className="ml-3 text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{result.type}</span>}
                      </h2>
                      <div className="flex items-center space-x-2">
                        {result && (
                          <>
                            {/* PDF Download Button */}
                            <button 
                              onClick={handleDownloadPDF}
                              disabled={isPdfGenerating}
                              className="flex items-center text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-red-600 px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Download as PDF"
                              aria-label="Download as PDF"
                            >
                              {isPdfGenerating ? (
                                <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-1.5"></span>
                              ) : (
                                <FileDown className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              PDF
                            </button>

                            <button 
                              onClick={() => navigator.clipboard.writeText(result.content)}
                              className="text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-slate-500"
                              aria-label="Copy content to clipboard"
                            >
                              Copy
                            </button>

                            {/* Plagiarism Check Button */}
                            <button
                               onClick={handleCheckPlagiarism}
                               disabled={checkingPlagiarism}
                               className={`flex items-center text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-md transition focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                                 checkingPlagiarism ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-indigo-600 hover:bg-indigo-50'
                               }`}
                               aria-label="Check Originality"
                               title="Scan text for originality"
                            >
                               {checkingPlagiarism ? (
                                 <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-1.5"></span>
                               ) : (
                                 <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                               )}
                               Scan
                            </button>
                            
                            {(activeTab === OutputType.CODE || activeTab === OutputType.SLIDES) && (
                              <button 
                                onClick={handleDownload}
                                className="flex items-center text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label={activeTab === OutputType.CODE ? "Download source code as ZIP" : "Download slides as Markdown"}
                              >
                                <Download className="w-3 h-3 mr-1.5" />
                                {activeTab === OutputType.CODE ? 'ZIP' : 'Slides (MD)'}
                              </button>
                            )}
                            
                            {(activeTab !== OutputType.CODE && activeTab !== OutputType.SLIDES) && (
                              <button 
                                onClick={handleDownload}
                                className="flex items-center text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                aria-label="Download content"
                              >
                                <Download className="w-3 h-3 mr-1.5" />
                                Save
                              </button>
                            )}
                          </>
                        )}
                        
                        {result && (
                          <button 
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition ml-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                            aria-label={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                          >
                            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className={`p-6 flex-1 overflow-y-auto custom-scrollbar ${isFullScreen ? 'h-[calc(100vh-60px)]' : 'max-h-[calc(100vh-250px)]'}`} role="main">
                      {loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4" role="status" aria-label="Loading content">
                          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                          <p className="animate-pulse">Consulting the digital library...</p>
                        </div>
                      ) : result ? (
                        activeTab === OutputType.SLIDES ? (
                          <SlideDeck key={result.timestamp} content={result.content} />
                        ) : (
                          <MarkdownRenderer content={result.content} />
                        )
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <MonitorPlay className="w-12 h-12 text-slate-300" />
                          </div>
                          <p className="text-center max-w-md">
                            Select a tool from the sidebar, configure your project details, and let AI assist with your academic journey.
                          </p>
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
