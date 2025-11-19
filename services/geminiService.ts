import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL } from '../constants';
import { NoteAnalysis, SearchResultItem, Entity, Researcher, ComputeResource, Grant, Lab, Project, PotentialGrant, MatchedResearcher } from "../types"; // Added Grant, Lab, Project, PotentialGrant, MatchedResearcher

if (!process.env.API_KEY) {
  console.error("API_KEY environment variable is not set. Gemini functionalities will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! }); // Assume API_KEY is set

export const summarizeText = async (textToSummarize: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key not configured. Summarization unavailable.";
  if (!textToSummarize.trim()) return "No text to summarize.";

  try {
    const prompt = `Summarize the following text in a concise manner (2-3 sentences):\n\n"${textToSummarize}"`;
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error summarizing text:", error);
    return "Error summarizing text. Please try again.";
  }
};

export const analyzeNotes = async (notesText: string): Promise<NoteAnalysis> => {
  if (!process.env.API_KEY) return { sentiment: 'Unknown', keyThemes: ["API Key not configured"] };
  if (!notesText.trim()) return { sentiment: 'Unknown', keyThemes: ["No text to analyze"] };
  
  const prompt = `Analyze the following text. Provide the sentiment (Positive, Negative, Neutral, or Mixed) and extract up to 5 key themes. Format your response as a JSON object with keys "sentiment" and "keyThemes" (an array of strings). For example: {"sentiment": "Positive", "keyThemes": ["Project Update", "Collaboration Success"]}. Text to analyze: \n\n"${notesText}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    return {
      sentiment: parsed.sentiment || 'Unknown',
      keyThemes: parsed.keyThemes || ['Could not extract themes'],
    };

  } catch (error) {
    console.error("Error analyzing notes:", error);
    return {
      sentiment: 'Unknown',
      keyThemes: ['Error during analysis'],
    };
  }
};

export const performGlobalSearch = async (
    query: string, 
    data: { 
        researchers: Entity[], 
        labs: Entity[], 
        projects: Entity[], 
        computeResources: Entity[],
        grants: Entity[] // Added grants
    }
): Promise<SearchResultItem[]> => {
  if (!process.env.API_KEY) return [{ id: 'error', type: 'Researcher', name: "API Key not configured", matchContext: '' }];
  if (!query.trim()) return [];

  const contextData = `
    Researchers: ${JSON.stringify(data.researchers.map(r_entity => {
        const r = r_entity as Researcher; 
        return { 
          id: r.id, name: r.name, firstName: r.firstName, lastName: r.lastName, netId: r.netId,
          title: r.title, email: r.email, employeeId: r.employeeId, ucrCid: r.ucrCid,
          org: r.org, div: r.div, department: r.department, research: r.research, // Changed from researchInterests
        };
    }))}
    Labs: ${JSON.stringify(data.labs.map(l_entity => {
        const l = l_entity as Lab;
        return { id: l.id, name: l.name, description: l.description };
    }))}
    Projects: ${JSON.stringify(data.projects.map(p_entity => {
        const p = p_entity as Project;
        return { id: p.id, name: p.name, description: p.description };
    }))}
    Compute Resources: ${JSON.stringify(data.computeResources.map(c_entity => {
        const c = c_entity as ComputeResource;
        return {
            id: c.id, name: c.name, type: c.type, specification: c.specification, status: c.status,
            clusterType: c.clusterType, nodes: c.nodes, cpus: c.cpus, cpusPerNode: c.cpusPerNode,
            nodeMemory: c.nodeMemory, totalRam: c.totalRam, gpus: c.gpus, gpusPerNode: c.gpusPerNode,
            clusterName: c.clusterName, totalCores: c.totalCores,
        };
    }))}
    Grants: ${JSON.stringify(data.grants.map(g_entity => {
        const g = g_entity as Grant;
        return {
            id: g.id, title: g.title, agency: g.agency, awardNumber: g.awardNumber, amount: g.amount,
            status: g.status, description: g.description,
        };
    }))}
  `;
  
  const prompt = `
    You are a search assistant for a research dashboard.
    Search the following data for items related to the query: "${query}".
    Data:
    ${contextData}
    
    Return a JSON array of objects, where each object has "id", "type" (Researcher, Lab, Project, ComputeResource, Grant), "name" of the item (for Grant, use its title), and a brief "matchContext" string explaining why it's relevant.
    Limit results to a maximum of 10 items. If no relevant items are found, return an empty array.
    Example format: [{"id": "researcher-1", "type": "Researcher", "name": "Dr. Alice Smith", "matchContext": "Works on AI in biology, matching query 'AI research'."}, {"id": "grant-1", "type": "Grant", "name": "NSF Grant for AI", "matchContext": "Grant title includes 'AI'."}]
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }

    const parsedResults = JSON.parse(jsonStr);
    if (Array.isArray(parsedResults)) {
      return parsedResults as SearchResultItem[];
    }
    return [];
  } catch (error) {
    console.error("Error performing global search:", error);
    return [{ id: 'error', type: 'Researcher', name: "Error during search", matchContext: (error as Error).message }];
  }
};


export const searchExternalGrants = async (criteria: string): Promise<PotentialGrant[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not configured. Grant search unavailable.");
    return [];
  }
  if (!criteria.trim()) return [];

  const prompt = `
    You are an AI assistant specialized in finding grant opportunities.
    Based on the following criteria: "${criteria}", search for relevant grant opportunities.
    For each grant, provide:
    - title: A clear title for the grant.
    - agency: The funding agency.
    - awardNumber: The award number or identifier, if available (otherwise "TBD" or "N/A").
    - amount: The estimated funding amount or range (e.g., "$50,000", "up to $1M", "$100k - $250k", or "Varies").
    - submissionDate: The submission deadline or relevant date information (e.g., "YYYY-MM-DD", "Rolling Basis", "Letter of Intent: YYYY-MM-DD").
    - description: A concise summary of the grant's purpose and eligibility.
    Return up to 7 results as a JSON array of objects. Each object must conform to this structure:
    { "title": "...", "agency": "...", "awardNumber": "...", "amount": "...", "submissionDate": "...", "description": "..." }
    Ensure all string values in the JSON output are properly escaped, especially for newlines (use \\\\n) and double quotes (use \\\\").
    If no relevant grants are found, return an empty array.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedResults = JSON.parse(jsonStr);
    if (Array.isArray(parsedResults)) {
      // Add a unique client-side ID to each result for selection management
      return parsedResults.map((grant, index) => ({ ...grant, id: `pg-${Date.now()}-${index}` })) as PotentialGrant[];
    }
    return [];
  } catch (error) {
    console.error("Error searching external grants:", error);
    // You might want to throw a custom error or return an object indicating failure
    throw new Error(`Failed to search grants: ${(error as Error).message}`);
  }
};

// Define a type for the enriched researcher information used in findMatchingResearchers
interface ExtendedResearcherInfo {
  id: string;
  name: string;
  research?: string; // Changed from researchInterests
  title?: string;
  org?: string;
  department?: string;
  associatedLabNames?: string[];
  associatedProjectDetails?: Array<{ name: string; description: string }>;
}


export const findMatchingResearchers = async (
  grantDescription: string,
  researchers: ExtendedResearcherInfo[]
): Promise<MatchedResearcher[]> => {
  if (!process.env.API_KEY) {
     console.warn("API Key not configured. Researcher matching unavailable.");
    return [];
  }
  if (!grantDescription.trim() || researchers.length === 0) return [];

  const researchersContext = JSON.stringify(
     researchers.map(r => ({ 
      id: r.id, 
      name: r.name, 
      research: r.research || "Not specified", // Changed from researchInterests
      title: r.title || "Not specified",
      organization: r.org || "Not specified",
      department: r.department || "Not specified",
      labs: r.associatedLabNames && r.associatedLabNames.length > 0 ? r.associatedLabNames.join(', ') : "None specified",
      projects: r.associatedProjectDetails && r.associatedProjectDetails.length > 0 
        ? r.associatedProjectDetails.map(p => `${p.name}: ${p.description.substring(0,100)}...`).join('; ') 
        : "None specified",
    }))
  );

  const prompt = `
    Given the following grant description:
    "${grantDescription}"

    And the following list of researchers with their profiles (including research, title, organization, department, associated labs, and projects):
    ${researchersContext}

    Perform a holistic and fuzzy relevance assessment. Identify up to 5 researchers from the list whose overall profile (considering all provided details, not just keywords in their research field) makes them suitable candidates for PI or Co-PI roles for this grant.
    For each matched researcher, provide their name, their stated research (if any), their original ID from the provided list, and a brief 'matchReason' (1-3 sentences) explaining why their comprehensive profile is a good fit for this grant, considering their title, department, lab work, and project experience in relation to the grant's focus.
    
    Return the results as a JSON array of objects. Each object must conform to this structure:
    { "originalId": "...", "name": "...", "research": "...", "matchReason": "..." } 
    
    IMPORTANT: Ensure the entire output is a single, valid JSON array. All string values within the JSON (especially 'matchReason' and 'research') must be properly escaped. For example, newlines within strings must be represented as \\\\n, and double quotes within strings as \\\\".
    If no suitable researchers are found after a comprehensive review, return an empty array.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonToParse = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const fenceMatch = jsonToParse.match(fenceRegex);
    if (fenceMatch && fenceMatch[2]) {
      jsonToParse = fenceMatch[2].trim();
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonToParse);
    } catch (e1) {
      if (e1 instanceof SyntaxError) {
        console.warn("Initial JSON.parse failed for findMatchingResearchers. Attempting newline/carriage return fix.", e1.message);
        try {
          const repairedJson = jsonToParse
            .replace(/(?<!\\)\n/g, '\\\\n') // Replace unescaped newlines
            .replace(/(?<!\\)\r/g, '\\\\r'); // Replace unescaped carriage returns
          parsedData = JSON.parse(repairedJson);
          console.log("Successfully parsed after attempting to fix newlines/carriage returns.");
        } catch (e2) {
          console.warn("Newline/carriage return fix and re-parse also failed. Falling back to array extraction heuristic.", e2);
          if (jsonToParse.includes('[') && jsonToParse.includes(']')) {
            const firstBracket = jsonToParse.indexOf('[');
            const lastBracket = jsonToParse.lastIndexOf(']');
            if (lastBracket > firstBracket) {
              const potentialArrayStr = jsonToParse.substring(firstBracket, lastBracket + 1);
              try {
                parsedData = JSON.parse(potentialArrayStr);
                console.log("Successfully parsed with array extraction heuristic (attempt 1).");
              } catch (e3) {
                console.warn("Array extraction heuristic failed. Trying newline fix on extracted substring.", e3.message);
                try {
                    const repairedPotentialArrayStr = potentialArrayStr
                        .replace(/(?<!\\)\n/g, '\\\\n')
                        .replace(/(?<!\\)\r/g, '\\\\r');
                    parsedData = JSON.parse(repairedPotentialArrayStr);
                    console.log("Successfully parsed with array extraction and newline fix (attempt 2).");
                } catch (e4) {
                    console.error("All parsing attempts failed for findMatchingResearchers.", e4);
                    throw e1; // Re-throw the initial or a more relevant error
                }
              }
            } else {
               throw e1; 
            }
          } else {
            throw e1; 
          }
        }
      } else {
        throw e1; // Not a syntax error, re-throw
      }
    }
    
    if (Array.isArray(parsedData)) {
      if (parsedData.length === 0 || parsedData.every(item => typeof item === 'object' && item !== null && 'name' in item && 'matchReason' in item && 'originalId' in item)) {
        return parsedData.map(item => ({
          ...item,
          research: item.research || "Not specified" // Changed from researchInterests
        })) as MatchedResearcher[];
      } else {
        console.warn("AI response for findMatchingResearchers was an array, but items had unexpected structure:", parsedData);
        throw new Error("AI returned an array with unexpected object structure.");
      }
    } else {
      console.warn('AI response for findMatchingResearchers was not a JSON array as expected:', parsedData);
      throw new Error('AI response was not a JSON array as expected.');
    }
  } catch (error) {
    console.error("Error finding matching researchers:", error);
    throw new Error(`Failed to match researchers: ${(error as Error).message}`);
  }
};

export const generateGrantIntroEmail = async (grant: Grant, pi: Researcher): Promise<{ subject: string; body: string }> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not configured. Email generation unavailable.");
    return { subject: "Grant Collaboration Inquiry", body: "Could not generate email content due to API key configuration." };
  }

  const grantDetails = `
    - Grant Title: ${grant.title}
    - Funding Agency: ${grant.agency}
    - Description: ${grant.description || 'Not specified. Focus on the title and agency.'}
    - Amount: $${grant.amount.toLocaleString()}
    - Submission Due: ${grant.proposalDueDate ? new Date(grant.proposalDueDate).toLocaleDateString() : 'See grant details'}
  `.trim();

  const piDetails = `
    - Name: ${pi.name}
    - Title: ${pi.title || 'N/A'}
    - Department: ${pi.department}
  `.trim();

  const prompt = `
    You are an expert assistant helping to draft professional and cordial collaboration emails.
    The Principal Investigator (PI) for a grant opportunity wants to contact the UCR Research Computing team.

    Grant Opportunity Details:
    ${grantDetails}

    Principal Investigator (PI) Details:
    ${piDetails}

    Task:
    Draft an email *from the perspective of ${pi.name}* to send to the "UCR Research Computing team".
    The email's purpose is to:
    1. Cordially introduce ${pi.name} and this specific grant opportunity.
    2. Briefly highlight why this grant might require or benefit from collaboration with the Research Computing team. For example, mention potential needs for high-performance computing, data storage, specialized software, data analysis expertise, or other research computing support that UCR provides. Be specific if the grant description hints at such needs.
    3. Express interest in discussing potential collaboration on the grant submission.
    4. Maintain a professional, friendly, and inviting tone throughout.
    
    IMPORTANT:
    - Do NOT include a salutation (like 'Dear UCR Research Computing team,'). The user will add this.
    - Do NOT include a closing (like 'Sincerely, ${pi.name}'). The user will add this.
    - Focus on providing only the email subject line and the email body content.

    Return your response as a single, valid JSON object with two keys: "subject" (a string for the email subject line) and "body" (a string for the email body).
    Ensure all string values in the JSON output, especially in the 'body', are properly escaped for newlines (use \\\\n) and double quotes (use \\\\").
    Example structure: { "subject": "Inquiry regarding collaboration on [Grant Title]", "body": "I am writing to introduce myself...\\\\nI believe this grant presents an opportunity..." }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedResult = JSON.parse(jsonStr);
    if (parsedResult && typeof parsedResult.subject === 'string' && typeof parsedResult.body === 'string') {
      return { subject: parsedResult.subject, body: parsedResult.body };
    } else {
      throw new Error("AI response did not conform to the expected JSON structure for subject and body.");
    }

  } catch (error) {
    console.error("Error generating grant intro email:", error);
    throw new Error(`Failed to generate email: ${(error as Error).message}`);
  }
};
