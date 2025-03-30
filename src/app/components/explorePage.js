"use client";

import { useState, useEffect } from "react";
import PostPreview from "./postPreview";
import { fetchAllFromIPFS, fetchFromIPFSById } from "../pinata";

export default function ExplorePage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decodedPosts, setDecodedPosts] = useState([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetchAllFromIPFS();
        console.log(response);
        if (response.success) {
          setPosts(response.data);
          // Fetch actual content for each pin
          const postPromises = response.data.map(async (pin) => {
            try {
              const contentResponse = await fetchFromIPFSById(pin.id);
              if (contentResponse.success) {
                return {
                  ...contentResponse.data,
                  pinData: pin,
                  date: pin.date_pinned
                };
              }
              return null;
            } catch (error) {
              console.error(`Failed to fetch content for pin ${pin.id}:`, error);
              return null;
            }
          });

          const resolvedPosts = (await Promise.all(postPromises))
            .filter(post => post !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          
          setDecodedPosts(resolvedPosts);
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading posts: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore</h1>
      <div className="space-y-6">
        {decodedPosts.map((post, index) => (
          <div key={post.pinData.id} className="shadow-lg rounded-lg overflow-hidden">
            <PostPreview post={post} />
          </div>
        ))}
        {decodedPosts.length === 0 && (
          <div className="text-center text-gray-500">No posts found</div>
        )}
      </div>
    </div>
  );
}
