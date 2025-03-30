"use client";

import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import CreatePost from "./components/createPost";

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
            <CreatePost session={session} />
            <UserProfile user={session?.user} />
            
            {/* Added the IPFS testing UI */}
            <div className="mt-8 p-4 border rounded-lg w-full max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-4">IPFS Testing</h2>
              <div className="space-y-4">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded cursor-pointer disabled:bg-blue-300"
                >
                  {loading ? "Processing..." : "Upload Test Data"}
                </button>
                
                <button
                  onClick={handleFetch}
                  disabled={loading || !ipfsId}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded cursor-pointer disabled:bg-green-300"
                >
                  Fetch Data
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={loading || !ipfsId}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded cursor-pointer disabled:bg-red-300"
                >
                  Delete Data
                </button>
                
                {ipfsId && (
                  <div className="mt-2">
                    <p className="font-semibold">Current IPFS ID:</p>
                    <code className="block p-2 bg-gray-100 rounded overflow-x-auto">
                      {ipfsId}
                    </code>
                  </div>
                )}
                
                {fetchedData && (
                  <div className="mt-2">
                    <p className="font-semibold">Fetched Data:</p>
                    <pre className="p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify(fetchedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
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