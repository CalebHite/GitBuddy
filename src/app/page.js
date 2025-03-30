"use client";

import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import CreatePost from "./components/createPost";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import ExplorePage from "./components/explorePage";

// Define UserProfile component that was missing
const UserProfile = ({ user }) => {
  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-4">
        {user?.image && (
          <img src={user.image} alt="Profile" className="w-12 h-12 rounded-full" />
        )}
        <div>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  );
};

export default function Home() {
  // Use the client-side useSession hook instead of getServerSession
  const { data: session } = useSession();
  const [ipfsId, setIpfsId] = useState("");
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);

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

  return (
    <div className="min-h-screen p-8">
      <div className="space-y-4">
        {session ? (
          <div className="flex flex-col items-center gap-4">
            <UserProfile user={session?.user} />
            <Button
              onClick={() => setShowCreatePost(!showCreatePost)}
              variant="outline"
              size="icon"
              className="rounded-full bg-blue-500 text-white hover:bg-blue-600 hover:text-white cursor-pointer"
            >
              {showCreatePost ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
            
            {showCreatePost && <CreatePost session={session} />}
            
            <ExplorePage />
          </div>
        ) : (
          <button
            onClick={() => signIn('github')}
            className="px-4 py-2 bg-gray-800 text-white rounded cursor-pointer"
          >
            Sign In with GitHub
          </button>
        )}
      </div>
    </div>
  );
}