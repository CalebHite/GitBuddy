"use client";

import { useState, useEffect } from "react";
import PostPreview from "./postPreview";
import { fetchAllFromIPFS, fetchFromIPFS } from "../pinata";
import ViewPost from "./ViewPost";
import UserProfile from "./UserProfile";
import { motion, AnimatePresence } from "framer-motion";

export default function ExplorePage({ session }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [decodedPosts, setDecodedPosts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right');
  const [userStreak, setUserStreak] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await fetchAllFromIPFS();
        console.log("IPFS Response:", response);

        if (response.success && Array.isArray(response.data)) {
          // Now response.data should be the array of pins
          setPosts(response.data);

          // Fetch content for each pin
          const postPromises = response.data.map(async (pin) => {
            try {
              console.log("Processing pin:", pin);
              const contentResponse = await fetchFromIPFS(pin.ipfs_pin_hash);
              console.log("Content response for pin:", contentResponse);

              if (contentResponse.success && contentResponse.data) {
                return {
                  ...contentResponse.data,
                  ipfsHash: pin.ipfs_pin_hash,
                  date: pin.date_pinned
                };
              }
              return null;
            } catch (error) {
              console.error(`Failed to fetch content for pin ${pin.ipfs_pin_hash}:`, error);
              return null;
            }
          });

          const resolvedPosts = (await Promise.all(postPromises))
            .filter(post => post !== null)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

          console.log("Resolved posts:", resolvedPosts);
          setDecodedPosts(resolvedPosts);
        } else {
          throw new Error(response.message || "Failed to fetch posts from IPFS");
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

  // Add these navigation handlers
  const handlePreviousPost = () => {
    setSlideDirection('left');
    setCurrentPostIndex((prev) => (prev > 0 ? prev - 1 : decodedPosts.length - 1));
  };

  const handleNextPost = () => {
    setSlideDirection('right');
    setCurrentPostIndex((prev) => (prev < decodedPosts.length - 1 ? prev + 1 : 0));
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

  // Debug information about posts
  console.log("Current decoded posts:", decodedPosts);
  console.log("Current post index:", currentPostIndex);
  console.log("Current post:", decodedPosts[currentPostIndex]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-8 border rounded-lg bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore</h1>
      {decodedPosts.length > 0 ? (
        <div className="relative">
          <button
            onClick={handlePreviousPost}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-500 w-10 h-10 rounded-full shadow-lg hover:bg-blue-600 text-white z-20 cursor-pointer flex items-center justify-center text-xl"
          >
            ←
          </button>
          
          <div className="mx-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPostIndex}
                initial={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? 100 : -100,
                }}
                animate={{ 
                  opacity: 1,
                  x: 0,
                }}
                exit={{ 
                  opacity: 0,
                  x: slideDirection === 'right' ? -100 : 100,
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 30,
                  duration: 0.3
                }}
              >
                <ViewPost 
                  post={decodedPosts[currentPostIndex]} 
                  onAvatarClick={handleAvatarClick}
                  isPersonal={decodedPosts[currentPostIndex].email === session?.user?.email}
                  streak={decodedPosts[currentPostIndex].email === session?.user?.email ? userStreak : 0}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <button
            onClick={handleNextPost}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-500 w-10 h-10 rounded-full shadow-lg hover:bg-blue-600 text-white z-20 cursor-pointer flex items-center justify-center text-xl"
          >
            →
          </button>

          <div className="text-center mt-4 text-gray-500">
            {currentPostIndex + 1} of {decodedPosts.length}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">No posts found</div>
      )}

      {/* Debug section */}
      <div className="mt-4 p-4 bg-gray-100 rounded-lg text-sm">
        <p>Raw posts length: {posts.length}</p>
        <p>Decoded posts length: {decodedPosts.length}</p>
        <p>Current index: {currentPostIndex}</p>
        {decodedPosts[currentPostIndex] && (
          <pre className="mt-2 overflow-x-auto">
            {JSON.stringify(decodedPosts[currentPostIndex], null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
