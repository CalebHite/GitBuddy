// GitHub Commit Summarizer using Google Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';


export function createCommitSummarizer() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  console.log(apiKey);
  const modelName = "gemini-pro";
  const maxOutputTokens = 256;
  
  // Initialize the Google Generative AI with the provided API key
  const genAI = new GoogleGenerativeAI({apiKey: apiKey});
  
  // Get the model
  const model = genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      maxOutputTokens,
      temperature: 0.4 // Lower temperature for more focused, consistent summaries
    }
  });

  return async function summarizeCommits(commitData, options) {
    options = options || {};
    const includeTechnicalDetails = options.includeTechnicalDetails || false;
    const groupByFeature = options.groupByFeature !== undefined ? options.groupByFeature : true;
    
    // Handle both single commits and arrays of commits
    const commits = Array.isArray(commitData) ? commitData : [commitData];
    
    if (commits.length === 0) {
      return "No commits to summarize.";
    }
    
    // Format the commit data to send to Gemini
    const formattedCommits = commits.map(commit => {
      return {
        id: commit.id || commit.sha,
        message: commit.message || (commit.commit ? commit.commit.message : null),
        author: (commit.author ? commit.author.name : null) || 
                (commit.commit && commit.commit.author ? commit.commit.author.name : "Unknown"),
        date: (commit.commit && commit.commit.author) ? commit.commit.author.date : 
              (commit.date || new Date().toISOString()),
        files: (commit.files || []).map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions
        }))
      };
    });
    
    // Create the prompt for Gemini
    const prompt = `
      Summarize the following GitHub ${commits.length > 1 ? 'commits' : 'commit'} concisely:
      
      ${JSON.stringify(formattedCommits, null, 2)}
      
      ${includeTechnicalDetails ? 
        'Include important technical details about what changed.' : 
        'Focus on the high-level purpose of the changes.'
      }
      
      ${groupByFeature && commits.length > 1 ? 
        'Group related commits by feature or purpose.' : 
        ''
      }
      
      Provide a clear, succinct summary that would help a developer understand the changes quickly.
    `;
    
    try {
      // Send the request to Gemini
      const result = await model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Error summarizing commits with Gemini:", error);
      throw new Error("Failed to summarize commits: " + error.message);
    }
  };
}