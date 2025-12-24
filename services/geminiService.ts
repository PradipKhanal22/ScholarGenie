
import { GoogleGenAI, Type } from "@google/genai";
import { Department, OutputType, ProjectRequest, PlagiarismResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using recommended model names based on task complexity
const MODEL_FAST = 'gemini-3-flash-preview';
const MODEL_SMART = 'gemini-3-pro-preview'; 

export const generateAcademicContent = async (request: ProjectRequest): Promise<string> => {
  let prompt = "";
  let systemInstruction = "You are a professional software developer and academic project mentor with 10+ years of experience. Your output must be plagiarism-free, clear, structured, and suitable for bachelor-level students. Use Markdown formatting significantly for headers, lists, and code blocks. IMPORTANT: The user requires extensive, detailed, and voluminous content. Do not summarize; expand on every point with deep technical and theoretical explanations.";

  const { department, topic, outputType, additionalContext } = request;
  const context = additionalContext ? `Additional Context/Requirements: ${additionalContext}` : "";

  // Prevent generation for History view
  if (outputType === OutputType.HISTORY) {
    return "";
  }

  switch (outputType) {
    case OutputType.IDEA:
      prompt = `Suggest 5 unique, innovative, and viable project ideas for a student in the ${department} department focusing on ${topic}. 
      ${context}
      For each idea, provide a detailed breakdown:
      1. **Title** (Catchy and Academic)
      2. **Detailed Summary** (A full paragraph explaining the concept)
      3. **Key Features** (At least 6-8 distinct features)
      4. **Tech Stack Recommendation** (Frontend, Backend, Database, Cloud/DevOps)
      5. **Complexity Level & Justification** (Why is it Low/Medium/High?)
      6. **Real-world Application** (Who benefits and how?)`;
      break;

    case OutputType.DOCS:
      prompt = `Create EXTENSIVE and DETAILED full project documentation for a ${department} project titled/about "${topic}".
      ${context}
      The output should be voluminous, covering every aspect in depth. Include the following sections formatted in Markdown:
      1. **Title**
      2. **Problem Statement** (3-4 paragraphs describing the current issues, gaps in existing systems, and the necessity of this project)
      3. **Objectives** (Provide 1 Main Objective and 7-10 Specific Objectives in a bulleted list)
      4. **Scope** (Detailed In-Scope and Out-of-Scope lists, covering functional, non-functional, and user constraints)
      5. **Methodology / Technology Stack** (Justify every technology choice: Language, Framework, Database, Tools with detailed reasons)
      6. **System Architecture** (Describe modules in detail. Explain the ERD entities and relationships thoroughly. Explain DFD Level 0 and Level 1 flows in text form.)
      7. **Expected Output** (Describe the final deliverables, reports, and software artifacts)
      8. **Conclusion** (Summary of impact and learning outcomes)`;
      break;

    case OutputType.REPORT:
      prompt = `Write a COMPREHENSIVE and HIGH-QUALITY academic report for a final-year project on "${topic}" (${department}).
      ${context}
      The tone must be formal, academic, and professional. The content must be long and detailed. Include:
      1. **Abstract** (A robust 250-300 word summary of the entire project)
      2. **Introduction** (Background of study, Problem Statement, Objectives, Motivation - write at least 2 paragraphs for each)
      3. **Literature Review** (Analyze 4-5 theoretical concepts or existing systems. Compare them, highlight their limitations, and explain how your system overcomes them.)
      4. **System Analysis & Design** (Detailed Functional Requirements (10+ items), Non-Functional Requirements, Feasibility Study (Technical, Operational, Economic))
      5. **Methodology** (Detailed explanation of the chosen development lifecycle (e.g., Agile/Scrum) and why it suits this project)
      6. **Results & Discussion** (Describe the expected screenshots, test cases, and successfully met objectives. Discuss limitations.)
      7. **References** (List 5 valid-looking academic references in APA format)`;
      break;

    case OutputType.SLIDES:
      prompt = `Generate a DETAILED professional presentation structure for a project on "${topic}" (${department}).
      ${context}
      
      STRICT OUTPUT FORMATTING RULES:
      1. Use standard Markdown.
      2. CRITICAL: Separate EVERY slide using exactly "---" (three dashes) on a new line.
      3. Ensure there is a blank line before and after the "---".
      4. The first line of content for every slide must be the slide title using Markdown H1 syntax (e.g. "# Slide Title").
      5. Do not include any introductory or concluding text outside the slides. Start directly with the first slide title.
      
      Content Requirements:
      - Total Slides: 12-15
      - Content per slide: 5-8 detailed bullet points. Do not be brief; explain the points.
      
      Required Slides:
      1. Title Slide (Project Name, Student Name, Department, Date)
      2. Introduction (Context and Background)
      3. Problem Statement (Detailed issues)
      4. Proposed Solution (High-level overview)
      5. Objectives (General and Specific)
      6. Literature Review (Existing systems analysis)
      7. Methodology (Process flow)
      8. Technology Stack (Tools and technologies)
      9. System Architecture (Diagram descriptions)
      10. Key Features (Core functionalities)
      11. Results / Expected Output (Deliverables)
      12. Challenges & Limitations
      13. Future Enhancements
      14. Conclusion
      15. Q&A`;
      break;

    case OutputType.CODE:
      prompt = `Provide EXTENSIVE and COMPREHENSIVE code examples for a project about "${topic}" using appropriate languages for ${department}.
      ${context}
      If it's web, use React/Node/PHP/Laravel. If AI, use Python.
      
      STRICT FORMAT REQUIREMENT:
      For each file, start with a line "File: <filename>" (e.g., File: app.py) followed by the code block.
      
      Requirements:
      1. **Do not provide snippets.** Provide complete, runnable files where possible.
      2. Include detailed comments explaining complex logic.
      3. Provide a 'README.md' file first explaining how to run the project.
      4. **Backend**: Provide a full controller or API service with multiple endpoints (GET, POST, PUT, DELETE).
      5. **Frontend**: Provide a full component with state management, UI rendering, and API integration.
      6. **Database**: Provide a SQL schema or Mongoose model file with complete field definitions.
      7. **Config**: Include a configuration file (e.g., .env example or config.js).
      
      Wrap code in markdown code blocks.`;
      break;

    case OutputType.ALL:
      prompt = `Provide a COMPREHENSIVE project suite for "${topic}" (${department}).
      ${context}
      This must be a large response covering all aspects in detail:
      1. **Project Title & Detailed Abstract**
      2. **Full Requirements Specification** (Functional & Non-functional)
      3. **Detailed Documentation Outline**
      4. **Code Structure** (File tree and 2-3 core code files with full content)
      5. **Presentation Outline** (List of slide titles and key talking points)
      
      Ensure the response is detailed enough to be used as a primary resource for starting the project.`;
      break;
  }

  // Use smart model for complex reasoning tasks
  const isComplexTask = [OutputType.CODE, OutputType.REPORT, OutputType.DOCS, OutputType.ALL, OutputType.SLIDES].includes(outputType);
  const selectedModel = isComplexTask ? MODEL_SMART : MODEL_FAST;

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Balance between creativity and structure
      }
    });

    return response.text || "No content generated. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please check your API key or network connection.";
  }
};

export const checkPlagiarism = async (text: string, comparisonContext?: string): Promise<PlagiarismResult> => {
  const contentToAnalyze = text.length > 15000 ? text.slice(0, 15000) + "..." : text;
  
  const referencePrompt = comparisonContext 
    ? `The user has provided the following reference materials/URLs for specific cross-referencing:
       ---
       ${comparisonContext}
       ---
       Strictly prioritize checking against these specific materials in addition to general knowledge.`
    : "";

  const prompt = `Analyze the following academic text for originality and uniqueness. 
  ${referencePrompt}

  Estimate a "similarity score" (0 to 100) representing the likelihood of this content overlapping with internet sources, documentation, or common academic phrasing. 
  Provide a detailed analysis explaining the score and list up to 3 potential flagged sources if any.

  Text to analyze:
  "${contentToAnalyze}"`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Similarity percentage (0-100)" },
            analysis: { type: Type.STRING, description: "Detailed explanation of the findings" },
            flaggedSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING },
                  matchLevel: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
                },
                required: ["title", "matchLevel"]
              }
            }
          },
          required: ["score", "analysis"]
        }
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText) as PlagiarismResult;
  } catch (error) {
    console.error("Plagiarism check failed", error);
    return { score: 0, analysis: "Could not perform check. Please try again." };
  }
};
