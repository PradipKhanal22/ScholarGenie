import { GoogleGenAI } from "@google/genai";
import { Department, OutputType, ProjectRequest } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_SMART = 'gemini-3-pro-preview'; 

export const generateAcademicContent = async (request: ProjectRequest): Promise<string> => {
  let prompt = "";
  let systemInstruction = "You are a professional software developer and academic project mentor with 10+ years of experience. Your output must be plagiarism-free, clear, structured, and suitable for bachelor-level students. Use Markdown formatting significantly for headers, lists, and code blocks.";

  const { department, topic, outputType, additionalContext } = request;
  const context = additionalContext ? `Additional Context/Requirements: ${additionalContext}` : "";

  // Prevent generation for History view
  if (outputType === OutputType.HISTORY) {
    return "";
  }

  switch (outputType) {
    case OutputType.IDEA:
      prompt = `Suggest 5 unique and viable project ideas for a student in the ${department} department focusing on ${topic}. 
      ${context}
      For each idea, provide:
      1. **Title**
      2. **One-sentence summary**
      3. **Key Features** (Bullet points)
      4. **Tech Stack Recommendation**
      5. **Complexity Level** (Low/Medium/High)`;
      break;

    case OutputType.DOCS:
      prompt = `Create full project documentation for a ${department} project titled/about "${topic}".
      ${context}
      Include the following sections formatted in Markdown:
      1. **Title**
      2. **Problem Statement** (Real-world issue this solves)
      3. **Objectives** (Bulleted list)
      4. **Scope** (What is included and excluded)
      5. **Methodology / Technology Stack**
      6. **System Architecture** (Describe the modules, ERD, and DFD logic in text)
      7. **Expected Output**
      8. **Conclusion**`;
      break;

    case OutputType.REPORT:
      prompt = `Write high-quality academic report content for a project on "${topic}" (${department}).
      ${context}
      The tone should be formal and academic. Include:
      1. **Abstract** (Summary of the entire project)
      2. **Introduction** (Background and motivation)
      3. **Literature Review** (Suggest 3-4 theoretical existing systems or concepts related to this)
      4. **System Design** (Functional requirements)
      5. **Methodology** (Agile/Waterfall justification)
      6. **Results & Discussion** (Hypothetical successful outcomes)
      `;
      break;

    case OutputType.SLIDES:
      prompt = `Generate a professional presentation structure for a project on "${topic}" (${department}).
      ${context}
      
      STRICT OUTPUT FORMATTING RULES:
      1. Use standard Markdown.
      2. CRITICAL: Separate EVERY slide using exactly "---" (three dashes) on a new line.
      3. Ensure there is a blank line before and after the "---".
      4. The first line of content for every slide must be the slide title using Markdown H1 syntax (e.g. "# Slide Title").
      5. Use bullet points for content.
      6. Do not include any introductory or concluding text outside the slides. Start directly with the first slide title.
      
      Required Slides (10-14 total):
      1. Title Slide (Project Name, Student Name, Department)
      2. Introduction
      3. Problem Statement
      4. Objectives
      5. Literature Review
      6. Methodology / System Design
      7. Tech Stack
      8. Key Features
      9. System Architecture (Diagram description)
      10. Results / Expected Output
      11. Future Enhancements
      12. Conclusion`;
      break;

    case OutputType.CODE:
      prompt = `Provide basic code examples (boilerplate/starter code) for a project about "${topic}" using appropriate languages for ${department}.
      ${context}
      If it's web, use React/Node/PHP/Laravel. If AI, use Python.
      
      STRICT FORMAT REQUIREMENT:
      For each file, start with a line "File: <filename>" (e.g., File: app.py) followed by the code block.
      
      Provide at least:
      1. Directory Structure idea.
      2. Key algorithm or backend controller logic (File: controller.js or similar).
      3. A frontend component or view (File: component.jsx or similar).
      Wrap code in markdown code blocks.`;
      break;

    case OutputType.ALL:
      prompt = `This is a comprehensive request. Provide a condensed summary covering ALL aspects for a project on "${topic}" (${department}).
      ${context}
      1. **Project Idea & Title**
      2. **Core Objectives**
      3. **Brief Documentation** (Problem, Scope, Stack)
      4. **Code Snippet** (One core function)
      5. **Slide Outline** (5 key slides)
      Keep it concise but useful to get started immediately.`;
      break;
  }

  // Use smart model for complex tasks
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