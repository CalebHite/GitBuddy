'use client';
import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react"
import CreatePost from "./components/createPost";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const [ipfsId, setIpfsId] = useState("");
  const [fetchedData, setFetchedData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log(session);
  }, [session]);

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
    console.log('hi')
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
          <div className="flex-col items-center gap-4">
            <CreatePost session={session} />
            <UserProfile user={session?.user} />
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