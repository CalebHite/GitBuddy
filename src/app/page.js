"use client";

import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import CreatePost from "./components/createPost";
import UserProfile from "./components/userProfile";
import { Button } from "@/components/ui/button";
import { Plus, Globe, UserRound } from "lucide-react";
import ExplorePage from "./components/explorePage";
import LoginPage from "./components/LoginPage";

export default function Home() {
  const { data: session } = useSession();
  const [ipfsId, setIpfsId] = useState("");
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');

  // Example JSON data to upload
  const exampleData = {
    name: "Test Data",
    description: "This is a test JSON object",
    timestamp: new Date().toISOString()
  };

  // Helper function to toggle tabs
  const toggleTab = (tabName) => {
    if (activeTab !== tabName) {
      setActiveTab(tabName);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="space-y-4">
        {session ? (
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

            {/* Tab content */}
            {activeTab === 'profile' && <UserProfile user={session?.user} />}
            {activeTab === 'create' && <CreatePost session={session} />}
            {activeTab === 'explore' && <ExplorePage session={session} />}
          </div>
        ) : (
          <LoginPage />
        )}
      </div>
    </div>
  );
}