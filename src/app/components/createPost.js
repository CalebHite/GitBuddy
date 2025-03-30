"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS } from "../pinata"
import { getLatestCommit } from "../github"
import { ethers } from "ethers"
import { generateSummary } from "../gemini"
import { STREAK_CONTRACT_ADDRESS, STREAK_CONTRACT_ABI } from '../contracts/streakContract';
import { useRouter } from 'next/navigation';

export default function CreatePost({ session, signer, onPostCreated }) {
  const router = useRouter();
  const [post, setPost] = useState({
    userName: session?.user?.name || "",
    email: session?.user?.email || "",
    img: session?.user?.image || "",
    githubCommit: null
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGithubCommit = async () => {
      try {
        setLoading(true);
        console.log("Full session data:", session);
        console.log("Session user data:", session?.user);
        
        const githubEmail = session?.user?.email;
        const accessToken = session?.user?.accessToken;

        console.log("Auth details:", {
          hasEmail: !!githubEmail,
          email: githubEmail,
          hasToken: !!accessToken,
          tokenPrefix: accessToken?.substring(0, 5) // Just show first 5 chars for security
        });

        if (!accessToken) {
          throw new Error("No GitHub access token found in session");
        }

        const commitData = await getLatestCommit(githubEmail, accessToken);
        console.log("Received commit data:", commitData);

        if (!commitData.files || commitData.files.length === 0) {
          throw new Error("No files found in commit data");
        }

        const summary = await generateSummary(commitData.files[commitData.files.length - 1]);
                
        setPost(currentPost => ({
          ...currentPost,
          githubCommit: {
            repository: commitData.repository,
            message: commitData.commitMessage,
            date: commitData.commitDate,
            url: commitData.commitUrl,
            files: commitData.files,
            summary: summary,
          },
        }));
      } catch (error) {
        console.error("Detailed error in fetchGithubCommit:", {
          message: error.message,
          stack: error.stack,
          sessionData: {
            hasEmail: !!session?.user?.email,
            hasAccessToken: !!session?.user?.accessToken
          }
        });
        setError(`Failed to fetch commit data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    if (session?.user?.email) {
      fetchGithubCommit();
    }
  }, [session]);

  const handleCreatePost = async () => {
    try {
      setLoading(true);
      const ipfsResponse = await uploadJsonToIPFS(post);
      if (!ipfsResponse.success) {
        throw new Error(ipfsResponse.message);
      }

      const contract = new ethers.Contract(
        STREAK_CONTRACT_ADDRESS, 
        STREAK_CONTRACT_ABI, 
        signer
      );

      const tx = await contract.post();
      await tx.wait();

      alert(`Post created successfully! IPFS Hash: ${ipfsResponse.ipfsHash}`);

      const streak = await contract.getStreak();
      alert(`Current streak: ${streak.toString()} days`);

      // Call the parent function to switch tabs
      if (onPostCreated) {
        onPostCreated();
      }

    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        {/* Post Preview */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <PostPreview post={post} />
        </div>

        {/* Create Post Button */}
        <Button
          onClick={handleCreatePost}
          className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Creating Post...' : 'Create Post'}
        </Button>
      </div>
    </div>
  );
}

