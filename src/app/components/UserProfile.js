import { useEffect, useState } from 'react';
import { fetchAllFromIPFS, fetchFromIPFS } from '../pinata';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { checkAndFollowUser } from '../github';
import { ethers } from 'ethers';
import { STREAK_CONTRACT_ADDRESS, STREAK_CONTRACT_ABI } from '../contracts/streakContract';
import { UserPlus, MessageCirclePlus } from "lucide-react";
import TextingComponent from './TextingComponent';
import { signOut } from "next-auth/react";

const UserProfile = ({ user, isCurrentUser = false, signer }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [contractError, setContractError] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [showTextingComponent, setShowTextingComponent] = useState(false);

  const toggleTextingComponent = () => {
    setShowTextingComponent(prev => !prev);
  };

  const profileTitle = isCurrentUser ? 'My Profile' : `${user?.name}'s Profile`;

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to connect wallet');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);

      // After connecting, fetch blockchain data
      await fetchBlockchainData(provider);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setContractError(error.message);
    }
  };

  const fetchBlockchainData = async (provider) => {
    try {
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(
        STREAK_CONTRACT_ADDRESS, 
        STREAK_CONTRACT_ABI, 
        signer
      );

      const streakNumber = await contract.getStreak();
      const streakValue = streakNumber.toNumber();
      setStreak(streakValue);
    } catch (error) {
      console.error("Blockchain error:", error);
      setContractError(error.message);
    }
  };

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await fetchBlockchainData(provider);
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };

    if (isCurrentUser) {
      checkWalletConnection();
    }
  }, [isCurrentUser]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        // Fetch all pinned items
        const response = await fetchAllFromIPFS();

        if (response.success) {
          // First fetch content for all posts
          const postPromises = response.data.map(async (item) => {
            try {
              const contentResponse = await fetchFromIPFS(item.ipfs_pin_hash);
              return {
                ...contentResponse.data,
                timestamp: item.date_pinned,
                ipfsHash: item.ipfs_pin_hash
              };
            } catch (error) {
              console.error("Error fetching post content:", error);
              return null;
            }
          });

          // Then filter by user email
          const posts = (await Promise.all(postPromises))
            .filter(post => post !== null && post.email?.toLowerCase() === user?.email?.toLowerCase())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          setUserPosts(posts);
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchUserPosts();
    }
  }, [user?.email]);

  return (
    <div className="w-full max-w-2xl min-w-[320px] mx-auto mt-4 p-4 border rounded-lg bg-gray-50">
      <h1 className="text-3xl font-bold mb-8 text-center">{profileTitle}</h1>
  
      {/* User Info Section */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {streak >= 10 && isCurrentUser && (
            <DotLottieReact 
              src="https://lottie.host/ff8f0355-d3cc-4f44-9036-4869392d6c0a/gwXqvhcWei.lottie" 
              loop 
              autoplay 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[72%] w-24 h-24" 
            />
          )}
          {user?.image && (
            <img 
            src={user.image} 
            alt="Profile" 
            className="w-12 h-12 rounded-full relative min-w-[3rem] min-h-[3rem] object-cover" 
          />
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>
        {isCurrentUser || <button onClick={checkAndFollowUser}><UserPlus className="h-10 w-10 border rounded-full p-2 hover:bg-gray-100 cursor-pointer" /></button>      }
        {isCurrentUser || <button onClick={toggleTextingComponent}><MessageCirclePlus className="h-10 w-10 border rounded-full p-2 hover:bg-gray-100 cursor-pointer" /></button>}
      </div>
  
      {/* Wallet Connection Section */}
      {isCurrentUser && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          {!walletAddress ? (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Wallet:</span>
                <span className="text-sm text-gray-600">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
              </div>
              {contractError ? (
                <p className="text-red-500">{contractError}</p>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Current Streak:</span>
                  <span className={`${streak >= 10 ? 'text-orange-500' : 'text-blue-600'}`}>
                    {streak} days
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showTextingComponent && (
        <div className="fixed bottom-4 right-4 z-50">
          <TextingComponent userId={walletAddress} otherUserId={user?.githubUsername} />
        </div>
      )}
  
      {/* Only show Sign Out button if it's the current user's profile */}
      {isCurrentUser && (
        <button
          onClick={() => signOut()}
          className="mb-3 mt-3 px-4 py-2 border text-black rounded cursor-pointer hover:bg-gray-200"
        >
          Sign Out
        </button>
      )}
  
      {/* Posts Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
          {isCurrentUser ? 'Your Posts' : 'Posts'}
        </h3>
        {loading ? (
          <p className="text-gray-600">Loading your posts...</p>
        ) : userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post, index) => (
              <div key={post.ipfsHash} className="border rounded p-4 bg-white">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{post.githubCommit?.repository}</h4>
                  <p className="text-gray-400 text-xs">
                    Committed: {new Date(post.githubCommit?.date).toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-600 mt-2">{post.githubCommit?.message}</p>
                {post.githubCommit?.files && post.githubCommit.files.length > 0 && (
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <p className="font-mono text-sm mb-2">
                      {post.githubCommit.files[post.githubCommit.files.length - 1].filename}
                    </p>
                    <p className="text-xs mb-2">
                      +{post.githubCommit.files[post.githubCommit.files.length - 1].additions}
                      -{post.githubCommit.files[post.githubCommit.files.length - 1].deletions} changes
                    </p>
                    {post.githubCommit.summary && (
                      <div className="mt-4">
                        <div className="flex items-center">
                          <p className="text-md font-medium mr-2" style={{
                            background: "linear-gradient(90deg, #8B5CF6, #3B82F6)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            marginRight: "5px",
                          }}>Summary</p>
                          <img 
                            src="/google-gemini-icon.webp" 
                            alt="Gemini Icon" 
                            width={20} 
                            height={20}
                            style={{ background: "none" }}
                          />
                        </div>
                        <p className="mt-2 text-sm">{post.githubCommit.summary}</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-400 mt-2">
                  Posted on: {new Date(post.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No posts found.</p>
        )}
      </div>
    </div>
  );  
};

export default UserProfile;
