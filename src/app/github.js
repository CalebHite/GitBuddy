import axios from 'axios';

const GITHUB_TOKEN = process.env.NEXT_PUBLIC_GITHUB_TOKEN;  // Add your GitHub token here

export async function getLatestCommit(email, accessToken) {
  try {
    if (!accessToken) {
      throw new Error("Access token is required");
    }

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json'
    };

    const userResponse = await axios.get('https://api.github.com/user', { headers });
    const username = userResponse.data.login;

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

    if (!searchResponse.data.items?.length) {
      throw new Error('No recent commits found for this email');
    }

    const latestCommit = searchResponse.data.items[0];
    const commitResponse = await axios.get(latestCommit.url, { headers });
    const commitData = commitResponse.data;

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
    throw new Error(`GitHub API Error: ${error.response?.data?.message || error.message}`);
  }
}

export async function checkAndFollowUser(targetUsername) {
  try {
    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
    };

    // Get the list of users that the authenticated user is following
    const followingResponse = await axios.get(`https://api.github.com/user/following`, {
      headers,  // Include headers for authentication
    });

    // Check if the authenticated user is already following the target user
    const isFollowing = followingResponse.data.some(following => following.login === targetUsername);

    if (isFollowing) {
      console.log(`You are already following ${targetUsername}.`);
      return;
    }

    // If not following, send a follow request
    const followResponse = await axios.put(`https://api.github.com/user/following/${targetUsername}`, null, {
      headers,  // Include headers for authentication
    });

    if (followResponse.status === 204) {
      console.log(`Successfully followed ${targetUsername}.`);
    } else {
      console.error('Failed to send follow request.');
    }
    
  } catch (error) {
    console.error('Error checking or following the user:', error);
  }
}
