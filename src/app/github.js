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
      try {
        const commitsResponse = await axios.get(`https://api.github.com/repos/${username}/${repo.name}/commits`, {
          headers,
          params: { per_page: 1 }
        });
        
        const commits = commitsResponse.data;
        
        if (commits.length > 0) {
          const commit = commits[0];
          
          // Only update latestCommit if this commit is more recent
          if (!latestCommit || new Date(commit.commit.author.date) > new Date(latestCommit.commitDate)) {
            try {
              const commitDetailsResponse = await axios.get(commit.url, {
                headers,
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
                  patch: file.patch || '' // Handle cases where patch might be undefined
                }))
              };
            } catch (detailsError) {
              console.error(`Error fetching commit details for ${repo.name}:`, detailsError);
              // Continue to next repo if we can't get details for this one
              continue;
            }
          }
        }
      } catch (repoError) {
        console.error(`Error fetching commits for ${repo.name}:`, repoError);
        // Continue to next repo if this one fails
        continue;
      }
    }

    // If no commits were found across repositories
    if (!latestCommit) {
      throw new Error('No commits found for this user');
    }

    // Ensure there's at least one file in the commit
    if (!latestCommit.files || latestCommit.files.length === 0) {
      throw new Error('No files found in the latest commit');
    }

    return latestCommit;

  } catch (error) {
    // Handle specific error cases
    if (error.response?.status === 409) {
      throw new Error('Conflict while fetching GitHub data. Please try again.');
    } else if (error.response?.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please try again later.');
    } else if (error.response?.status === 404) {
      throw new Error('GitHub repository or user not found.');
    }
    
    // Throw the original error with more context
    throw new Error(`Failed to fetch GitHub commit: ${error.message}`);
  }
}

// Check if userA is following userB
export async function isFollowingUser(userA, userB) {
  try {
    const response = await axios.get(`https://api.github.com/users/${userA}/following/${userB}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
      }
    });
    // If the request is successful (status 204), userA is following userB
    return response.status === 204;
  } catch (error) {
    if (error.response?.status === 404) {
      // 404 means userA is not following userB
      return false;
    }
    throw new Error(`Failed to check following status: ${error.message}`);
  }
}

// Make userA follow userB
export async function followUser(username) {
  try {
    // The username should be passed exactly as it appears in GitHub's URL format
    const response = await axios.put(
      `https://api.github.com/user/following/${username}`,
      {},  // empty body
      {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );
    return response.status === 204;  // GitHub returns 204 on success
  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw new Error('Failed to follow user: ' + (error.response?.data?.message || error.message));
  }
}

// Create a comment on a commit
export async function commentOnCommit(owner, repo, commitSha, comment) {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/commits/${commitSha}/comments`,
      {
        body: comment
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        }
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to create commit comment: ${error.message}`);
  }
}

