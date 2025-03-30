import axios from 'axios';

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;  // Add your GitHub token here

export async function getLatestCommit(email, accessToken) {
  try {
    console.log("Starting getLatestCommit with email:", email);

    if (!accessToken) {
      throw new Error("Access token is required");
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    console.log("Making user request...");
    // First get the authenticated user's information
    const userResponse = await axios.get('https://api.github.com/user', { headers });
    const username = userResponse.data.login;
    console.log("Found username:", username);

    console.log("Searching for commits...");
    // Get all commits by the user across all repositories
    const searchResponse = await axios.get(
      'https://api.github.com/search/commits', 
      {
        headers: {
          ...headers,
          'Accept': 'application/vnd.github.cloak-preview+json'
        },
        params: {
          q: `author-email:${email}`,
          sort: 'author-date',
          order: 'desc',
          per_page: 1
        }
      }
    );

    console.log("Search response:", searchResponse.data);

    if (!searchResponse.data.items?.length) {
      throw new Error('No recent commits found for this email');
    }

    const latestCommit = searchResponse.data.items[0];
    
    console.log("Getting full commit details...");
    // Get the full commit details
    const commitResponse = await axios.get(latestCommit.url, { headers });
    const commitData = commitResponse.data;

    console.log("Successfully fetched commit data");
    return {
      repository: latestCommit.repository.full_name,
      commitMessage: commitData.commit.message,
      commitDate: commitData.commit.author.date,
      commitUrl: commitData.html_url,
      files: commitData.files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        patch: file.patch
      }))
    };

  } catch (error) {
    console.error("Detailed error in getLatestCommit:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
  }
}
