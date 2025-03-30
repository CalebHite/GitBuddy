import axios from 'axios';

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;  // Add your GitHub token here

export async function getLatestCommit(email) {
  try {
    // Set up headers with authentication
    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
    };

    // First, search for the user by email
    const searchResponse = await axios.get('https://api.github.com/search/users', {
      headers,  // Include headers for authentication
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

    // Fetch all user's repositories (without sorting by 'updated')
    const reposResponse = await axios.get(`https://api.github.com/users/${username}/repos`, {
      headers,  // Include headers for authentication
      params: { per_page: 100 }  // Fetch up to 100 repos (increase if needed)
    });
    const repos = reposResponse.data;

    // If no repos exist, throw an error
    if (repos.length === 0) {
      throw new Error('No repositories found for this user');
    }

    let latestCommit = null;

    // Loop through each repository and fetch the latest commit from each one
    for (const repo of repos) {
      const commitsResponse = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/commits`, {
        headers,  // Include headers for authentication
        params: { per_page: 1 }
      });
      
      const commits = commitsResponse.data;
      
      if (commits.length > 0) {
        const commit = commits[0];
        // Compare commits to find the most recent one
        if (!latestCommit || new Date(commit.commit.author.date) > new Date(latestCommit.commitDate)) {
          // Fetch detailed commit information
          const commitDetailsResponse = await axios.get(commit.url, {
            headers,  // Include headers for authentication
          });
          const commitDetails = commitDetailsResponse.data;

          latestCommit = {
            repository: repo.name,
            commitSha: commit.sha,
            commitMessage: commit.commit.message,
            commitDate: commit.commit.author.date,
            commitUrl: commit.html_url,
            files: commitDetails.files.map(file => ({
              filename: file.filename,
              status: file.status,
              additions: file.additions,
              deletions: file.deletions,
              changes: file.changes,
              patch: file.patch
            }))
          };
        }
      }
    }

    // If no commits were found across repositories
    if (!latestCommit) {
      throw new Error('No commits found for this user');
    }

    return latestCommit;

  } catch (error) {
    console.error('Error fetching latest commit:', error);
    throw error;
  }
}
