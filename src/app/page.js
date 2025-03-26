'use client';
import { uploadJsonToIPFS, fetchFromIPFSById, deleteFromIPFSById } from "./pinata";
import { useState, useEffect } from "react";

export default function Home() {
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
        <button 
          onClick={handleUpload}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer"
        >
          Upload Example JSON
        </button>

        <button 
          onClick={handleFetch}
          disabled={loading || !ipfsId}
          className="px-4 py-2 bg-green-500 text-white rounded ml-2 cursor-pointer"
        >
          Fetch Data
        </button>

        <button 
          onClick={handleDelete}
          disabled={loading || !ipfsId}
          className="px-4 py-2 bg-red-500 text-white rounded ml-2 cursor-pointer"
        >
          Delete Data
        </button>

        {loading && <p>Loading...</p>}
        
        {ipfsId && (
          <div className="mt-4">
            <p>Current Unique ID: {ipfsId}</p>
          </div>
        )}

        {fetchedData && (
          <div className="mt-4">
            <h2 className="text-xl font-bold">Fetched Data:</h2>
            <pre className="bg-gray-100 p-4 rounded mt-2">
              {JSON.stringify(fetchedData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}