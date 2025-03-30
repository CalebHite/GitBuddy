"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS, fetchAllFromIPFS, fetchFromIPFS } from "../pinata"
import { getLatestCommit } from "../github"
import { ethers } from "ethers"
import { generateSummary } from "../gemini"
import { STREAK_CONTRACT_ADDRESS, STREAK_CONTRACT_ABI } from '../contracts/streakContract';
import { useRouter } from 'next/navigation';
import ConfettiComponent from './confetti';
import { toast } from "sonner"


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

  const [celebrate, setCelebrate] = useState(false);
  const [skipHours, setSkipHours] = useState(0);
  const [isCommitPosted, setIsCommitPosted] = useState(false);

  useEffect(() => {
    const fetchGithubCommit = async () => {
      try {
        setLoading(true);
        const githubEmail = session.user.email;
        const commitData = await getLatestCommit(githubEmail);
        const summary = await generateSummary(commitData.files[commitData.files.length - 1]);
                
        const response = await fetchAllFromIPFS();
        if (response.success && Array.isArray(response.data)) {
          const postPromises = response.data.map(pin => fetchFromIPFS(pin.ipfs_pin_hash));
          const posts = await Promise.all(postPromises);
          
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

          const isAlreadyPosted = posts.some(post => 
            post.success && 
            post.data?.githubCommit?.url === commitData.commitUrl
          );

          setIsCommitPosted(isAlreadyPosted);
          if (isAlreadyPosted) {
            setError("This commit has already been posted!");
          }
        } else {
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
        }
      } catch (error) {
        console.error("Error fetching GitHub commit:", error);
        setError("Failed to fetch commit data");
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
      const postData = {
        ...post,
        githubCommit: {
          ...post.githubCommit,
          summary: post.githubCommit.summary
        }
      };

      const ipfsResponse = await uploadJsonToIPFS(postData);
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

      toast(`Post created successfully! IPFS Hash: ${ipfsResponse.ipfsHash}`);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 3000);

      const streak = await contract.getStreak();
      setTimeout(() => toast(`Current streak: ${streak.toString()} days`), 2000);

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

  const handleSkipHours = async () => {
    try {
      const contract = new ethers.Contract(
        STREAK_CONTRACT_ADDRESS, 
        STREAK_CONTRACT_ABI, 
        signer
      );

      const tx = await contract.skipHours(skipHours);
      await tx.wait();
      toast(`Successfully skipped ${skipHours} hours`);
    } catch (error) {
      setError(`Failed to skip hours: ${error.message}`);
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
      <ConfettiComponent
        width={window.innerWidth}
        height={window.innerHeight}
        isCelebrating={celebrate}
      />
      <div className="flex flex-col gap-4">
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        {/* Post Preview with Skip Hours Input */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={skipHours}
                onChange={(e) => setSkipHours(parseInt(e.target.value) || 0)}
                className="w-24"
                placeholder="Hours"
              />
              <Button
                onClick={handleSkipHours}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                Skip Hours
              </Button>
            </div>
          </div>
          <PostPreview post={post} />
        </div>

        {/* Create Post Button */}
        <Button
          onClick={handleCreatePost}
          className="bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          disabled={loading || isCommitPosted}
        >
          {loading ? 'Creating Post...' : isCommitPosted ? 'Already Posted' : 'Create Post'}
        </Button>
      </div>
    </div>
  );
}

