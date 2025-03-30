"use client";

import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import CreatePost from "./components/createPost";
import UserProfile from "./components/UserProfile";
import { Button } from "@/components/ui/button";
import { Plus, Globe, UserRound } from "lucide-react";
import ExplorePage from "./components/explorePage";
import LoginPage from "./components/LoginPage";
import { ethers } from "ethers";

export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('explore');
  const [signer, setSigner] = useState(null);
  const [walletError, setWalletError] = useState(null);

  useEffect(() => {
    const connectWallet = async () => {
      if (!session) return;
      
      try {
        if (!window.ethereum) {
          throw new Error('Please install MetaMask to connect wallet');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const walletSigner = provider.getSigner();
        setSigner(walletSigner);
      } catch (error) {
        setWalletError(error.message);
      }
    };

    connectWallet();
  }, [session]);

  useEffect(() => {
    if (session) {
      console.log("Session data:", {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasAccessToken: !!session?.user?.accessToken,
        email: session?.user?.email
      });
    }
  }, [session]);

  // Helper function to toggle tabs
  const toggleTab = (tabName) => {
    if (activeTab !== tabName) {
      setActiveTab(tabName);
    }
  };

  const handlePostCreated = () => {
    setActiveTab('explore');
  };

  if (!session) {
    return <LoginPage />;
  }

  if (walletError) {
    return (
      <div className="text-red-500 p-4">
        Error connecting wallet: {walletError}
        <br />
        Please make sure MetaMask is installed and try again.
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      {signer ?
        <div className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          {/* Tab buttons */}
          <div className="flex gap-50 mb-4">
            <Button
              onClick={() => toggleTab('profile')}
              variant="outline"
              size="icon"
              className={`rounded-full ${
                activeTab === 'profile' 
                  ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white'
              } cursor-pointer`}
            >
              {activeTab === 'profile' ? (
                <UserRound className="h-8 w-8" />
              ) : (
                <UserRound className="h-8 w-8" />
              )}
            </Button>

            <Button
              onClick={() => toggleTab('explore')}
              variant="outline"
              size="icon"
              className={`rounded-full ${
                activeTab === 'explore' 
                  ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white'
              } cursor-pointer`}
            >
              {activeTab === 'explore' ? (
                <Globe className="h-8 w-8" />
              ) : (
                <Globe className="h-8 w-8" />
              )}
            </Button>
            <Button
              onClick={() => toggleTab('create')}
              variant="outline"
              size="icon"
              className={`rounded-full ${
                activeTab === 'create' 
                  ? 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white' 
                  : 'bg-blue-500 text-white hover:bg-blue-600 hover:text-white'
              } cursor-pointer`}
            >
              {activeTab === 'create' ? (
                <Plus className="h-8 w-8" />
              ) : (
                <Plus className="h-8 w-8" />
              )}
            </Button>
          </div>

          {/* Content */}
          {activeTab === 'profile' ? (
            <UserProfile user={session.user} isCurrentUser={true} signer={signer} />
          ) : activeTab === 'create' ? (
            <CreatePost 
              session={{
                ...session,
                user: {
                  ...session.user,
                  accessToken: session?.user?.accessToken
                }
              }} 
              signer={signer} 
              onPostCreated={handlePostCreated}
            />
          ) : (
            <ExplorePage session={session} signer={signer} />
          )}
        </div>
      </div>
        :

        <p>Connect a Wallet to Continue!</p>
      }
      
    </div>
  );
}