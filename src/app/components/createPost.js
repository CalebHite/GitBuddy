"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS } from "../pinata"
import { getLatestCommit } from "../github"
import { createCommitSummarizer } from '../gemini';

const summarizeCommits = createCommitSummarizer();

export default function CreatePost({ session }) {
  const [post, setPost] = useState({
    userName: session?.user?.name || "",
    email: session?.user?.email || "",
    img: session?.user?.image || "",
    githubCommit: null
  });

  useEffect(() => {
    const fetchGithubCommit = async () => {
      try {
        const githubEmail = session.user.email;
        const commitData = await getLatestCommit('charlieedoherty@gmail.com'); // Await the commit data
  
        const summary = "";

        setPost((currentPost) => ({
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
      const response = await uploadJsonToIPFS(post);
      if (response.success) {
        alert(`Post created and uploaded to IPFS! Hash: ${response.ipfsHash}`);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Failed to create post: ${error.message}`);
    }
  };

  return (
    <div className="w-1/2 space-y-6 center-items border rounded-lg bg-gray-50 p-8">
    <h1 className="text-3xl font-bold mb-8 text-center">Create Post</h1>
    {post && <PostPreview post={post} />}
    <Button variant="outline" className="hover:bg-gray-100 cursor-pointer bg-blue-500 text-white hover:bg-blue-600 hover:text-white" onClick={handleCreatePost}>Create Post</Button>
    </div>
  )
}

