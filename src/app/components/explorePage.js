"use client";

import { useState, useEffect } from "react";
import PostPreview from "./postPreview";
import { fetchAllFromIPFS, fetchFromIPFSById } from "../pinata";
import ViewPost from "./ViewPost";
import UserProfile from "./UserProfile";

export default function ExplorePage({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decodedPosts, setDecodedPosts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

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

  // Add handler for avatar clicks
  const handleAvatarClick = (user) => {
    setSelectedUser(user);
  };

  // Add handler to return to explore view
  const handleBackToExplore = () => {
    setSelectedUser(null);
  };

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

  // Show UserProfile if a user is selected
  if (selectedUser) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <button
          onClick={handleBackToExplore}
          className="mb-4 px-4 py-2 text-blue-500 hover:text-blue-700 cursor-pointer"
        >
          ← Back to Explore
        </button>
        <UserProfile 
          user={selectedUser} 
          isCurrentUser={session?.user?.email === selectedUser.email}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore</h1>
      <div className="space-y-6">
        {decodedPosts.map((post, index) => (
          <div key={post.pinData.id}>
            <ViewPost 
              post={post} 
              onAvatarClick={() => handleAvatarClick({
                name: post.userName,
                email: post.email,
                image: post.img || '/default-avatar.png'
              })}
            />
          </div>
        ))}
        {decodedPosts.length === 0 && (
          <div className="text-center text-gray-500">No posts found</div>
        )}
      </div>
    </div>
  );
}
