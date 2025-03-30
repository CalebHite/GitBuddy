// Method 2: Using Axios (requires npm install axios)
import axios from 'axios';

export async function getLatestCommit(email) {
  try {
    // First, search for the user by email
    const searchResponse = await axios.get('https://api.github.com/search/users', {
      params: { 
        q: `${email} in:email`,
        per_page: 1
      }
    });

    // Check if any user was found
    if (searchResponse.data.total_count === 0) {
      throw new Error('No GitHub user found with this email address');
    }

    const username = searchResponse.data.items[0].login;

    // Fetch user's repositories sorted by most recently updated
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      params: { sort: 'updated' }
    });
    const repos = reposResponse.data;

    // If no repos exist, throw an error
    if (repos.length === 0) {
      throw new Error('No repositories found for this user');
    }

    // Get the most recently updated repository
    const mostRecentRepo = repos[0];

    // Fetch the most recent commit with detailed information
    const commitsResponse = await axios.get(`https://api.github.com/repos/${username}/${mostRecentRepo.name}/commits`, {
      params: { per_page: 1 }
    });
    const commits = commitsResponse.data;

    // Get the detailed commit information including file changes
    const commitDetailsResponse = await axios.get(commits[0].url);
    const commitDetails = commitDetailsResponse.data;

    // Return the most recent commit details with file changes
    return {
      repository: mostRecentRepo.name,
      commitSha: commits[0].sha,
      commitMessage: commits[0].commit.message,
      commitDate: commits[0].commit.author.date,
      commitUrl: commits[0].html_url,
      files: commitDetails.files.map(file => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch // This contains the actual code changes
      }))
    };
  } catch (error) {
    console.error('Error fetching latest commit:', error);
    throw error;
  }
}