"use client";

import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import CreatePost from "./components/createPost";
import UserProfile from "./components/UserProfile";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Globe, UserRound, UserRoundX } from "lucide-react";
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

  const handleUpload = async () => {
    try {
      setLoading(true);
      const response = await uploadJsonToIPFS(exampleData);
      if (response.success) {
        setIpfsId(response.uniqueId);
        alert(`Successfully uploaded! IPFS Hash: ${response.ipfsHash}, Unique ID: ${response.uniqueId}`);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Failed to upload: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    if (!ipfsId) {
      alert("Please upload data first!");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetchFromIPFSById(ipfsId);
      if (response.success) {
        setFetchedData(response.data);
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!ipfsId) {
      alert("No data to delete!");
      return;
    }
    
    try {
      setLoading(true);
      const response = await deleteFromIPFSById(ipfsId);
      if (response.success) {
        setIpfsId("");
        setFetchedData(null);
        alert("Successfully deleted!");
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Failed to delete: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to toggle tabs
  const toggleTab = (tabName) => {
    if (activeTab === tabName) {
      setActiveTab('explore');
    } else {
      setActiveTab(tabName);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="space-y-4">
        {session ? (
          <div className="flex flex-col items-center gap-4">
            {/* Tab buttons */}
            <div className="flex gap-50">
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
                  <UserRoundX className="h-8 w-8" />
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
                  <Globe className="h-8 w-8 rotate-90" />
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
                  <Minus className="h-8 w-8" />
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