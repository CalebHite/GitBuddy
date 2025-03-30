"use client";

import { useState, useEffect } from "react";
import PostPreview from "./postPreview";
import { fetchAllFromIPFS, fetchFromIPFSById } from "../pinata";
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
          
          <div className="mx-20 overflow-hidden relative">
            <AnimatePresence initial={false}>
              <motion.div
                key={currentPostIndex}
                initial={{ 
                  x: slideDirection === 'right' ? '100%' : '-100%',
                  position: 'absolute',
                  width: '100%',
                }}
                animate={{ 
                  x: 0,
                  position: 'relative'
                }}
                exit={{ 
                  x: slideDirection === 'right' ? '-100%' : '100%',
                  position: 'absolute',
                  width: '100%',
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ViewPost 
                  post={decodedPosts[currentPostIndex]} 
                  onAvatarClick={() => handleAvatarClick({
                    name: decodedPosts[currentPostIndex].userName,
                    email: decodedPosts[currentPostIndex].email,
                    image: decodedPosts[currentPostIndex].img || '/default-avatar.png'
                  })}
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
        </div>
      ) : (
        <div className="text-center text-gray-500">No posts found</div>
      )}
    </div>
  );
}
