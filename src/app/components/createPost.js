"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS } from "../pinata"
import { getLatestCommit } from "../github"
import { ethers } from "ethers"
import { generateSummary } from "../gemini"
import { STREAK_CONTRACT_ADDRESS, STREAK_CONTRACT_ABI } from '../contracts/streakContract';

export default function CreatePost({ session, signer }) {
  const [post, setPost] = useState({
    userName: session?.user?.name || "",
    email: session?.user?.email || "",
    img: session?.user?.image || "",
    githubCommit: null
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGithubCommit = async () => {
      try {
        const githubEmail = session.user.email;
        const commitData = await getLatestCommit("charlieedoherty@gmail.com");

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
        console.error("Error fetching GitHub commit:", error);
      }
    };
  
    if (session?.user?.email) {
      fetchGithubCommit();
    }
  }, [session]);

  const handleCreatePost = async () => {
    try {
      // First, upload to IPFS
      const ipfsResponse = await uploadJsonToIPFS(post);
      if (!ipfsResponse.success) {
        throw new Error(ipfsResponse.message);
      }

      const contract = new ethers.Contract(
        STREAK_CONTRACT_ADDRESS, 
        STREAK_CONTRACT_ABI, 
        signer
      );

      // Call the post function on the smart contract
      const tx = await contract.post();
      await tx.wait(); // Wait for transaction to be mined

      // Show success message
      alert(`Post created successfully! IPFS Hash: ${ipfsResponse.ipfsHash}`);

      // Optionally fetch and display updated streak
      const streak = await contract.getStreak();
      alert(`Current streak: ${streak.toString()} days`);

    } catch (error) {
      console.error("Error creating post:", error);
      setError(error.message);
    }
  };

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
        >
          Create Post
        </Button>
      </div>
    </div>
  );
}

