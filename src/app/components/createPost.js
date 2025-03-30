"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS } from "../pinata"
import { getLatestCommit } from "../github"

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
        // switch email to githubEmail
        const commitData = await getLatestCommit("charlieedoherty@gmail.com");
        
        setPost(currentPost => ({
          ...currentPost,
          githubCommit: {
            repository: commitData.repository,
            message: commitData.commitMessage,
            date: commitData.commitDate,
            url: commitData.commitUrl,
            files: commitData.files
          }
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
    <div className="w-1/2 space-y-6 center-items">
    {post && <PostPreview post={post} />}
    <Button variant="outline" className="hover:bg-gray-100 cursor-pointer" onClick={handleCreatePost}>Create Post</Button>
    </div>
  )
}

