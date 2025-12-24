export enum Department {
  IT = "Information Technology",
  CSIT = "CSIT",
  BIM = "BIM",
  BBA = "BBA",
  MBA = "MBA",
  CS = "Computer Science",
  AI = "Artificial Intelligence",
  ML = "Machine Learning",
  WEB = "Web Development",
  MOBILE = "Mobile Apps",
  NETWORKING = "Networking",
  CYBER = "Cybersecurity"
}

export enum OutputType {
  IDEA = "Project Ideas",
  DOCS = "Documentation",
  REPORT = "Academic Report",
  SLIDES = "Presentation Slides",
  CODE = "Code Examples",
  ALL = "Full Project Suite",
  HISTORY = "History"
}

export interface ProjectRequest {
  department: Department | string;
  topic: string;
  outputType: OutputType;
  additionalContext?: string;
}

export interface GeneratedContent {
  id: string;
  type: OutputType;
  content: string;
  timestamp: number;
  topic?: string;
  department?: string;
  additionalContext?: string;
  plagiarismResult?: PlagiarismResult;
}

export interface PlagiarismResult {
  score: number;
  analysis: string;
  flaggedSources?: { title: string; url?: string; matchLevel: 'High' | 'Medium' | 'Low' }[];
}
