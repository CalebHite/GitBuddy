"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import PostPreview from "./postPreview"
import { uploadJsonToIPFS } from "../pinata"
import { getLatestCommit } from "../github"
import { ethers } from "ethers"

export default function CreatePost({ session }) {
  const [post, setPost] = useState({
    userName: session?.user?.name || "",
    email: session?.user?.email || "",
    img: session?.user?.image || "",
    githubCommit: null
  });
  const [walletAddress, setWalletAddress] = useState('');
  const [contractError, setContractError] = useState(null);

  const contractAddress = "0x7410b151dd9aee17b2fa3b24d5ed7dd560632b03";
  const abi = [
    {
      "inputs": [],
      "name": "post",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "streakCount",
          "type": "uint256"
        }
      ],
      "name": "PostLogged",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "currentTime",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getStreak",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "users",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "lastValidPostTime",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "streakCount",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ];

  useEffect(() => {
    const fetchGithubCommit = async () => {
      try {
        const githubEmail = session.user.email;
        const commitData = await getLatestCommit(githubEmail);
        
        setPost(currentPost => ({
          ...currentPost,
          githubCommit: {
            repository: commitData.repository,
            message: commitData.commitMessage,
            date: commitData.commitDate,
            url: commitData.commitUrl,
            files: commitData.files,
            summary: summary,
          },
        }));
      } catch (error) {
        console.error("Error fetching GitHub commit:", error);
      }
    };
  
    if (session?.user?.email) {
      fetchGithubCommit();
    }
  }, [session]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to connect wallet');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      return provider;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setContractError(error.message);
      return null;
    }
  };

  const handleCreatePost = async () => {
    try {
      // First, upload to IPFS
      const ipfsResponse = await uploadJsonToIPFS(post);
      if (!ipfsResponse.success) {
        throw new Error(ipfsResponse.message);
      }

      // Then interact with the smart contract
      const provider = await connectWallet();
      if (!provider) {
        throw new Error("Failed to connect wallet");
      }

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      // Call the post function on the smart contract
      const tx = await contract.post();
      await tx.wait(); // Wait for transaction to be mined

      // Show success message
      alert(`Post created successfully! IPFS Hash: ${ipfsResponse.ipfsHash}`);

      // Optionally fetch and display updated streak
      const streak = await contract.getStreak();
      alert(`Current streak: ${streak.toString()} days`);

    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Failed to create post: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Wallet Connection Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          {!walletAddress ? (
            <Button 
              onClick={connectWallet}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              Connect Wallet
            </Button>
          ) : (
            <div className="text-sm text-gray-600">
              Connected: {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
            </div>
          )}
          {contractError && (
            <p className="text-red-500 text-sm mt-2">{contractError}</p>
          )}
        </div>

        {/* Post Preview */}
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Preview</h2>
          <PostPreview post={post} />
        </div>

        {/* Create Post Button */}
        <Button
          onClick={handleCreatePost}
          className="bg-blue-500 text-white hover:bg-blue-600"
          disabled={!walletAddress}
        >
          Create Post
        </Button>
      </div>
    </div>
  );
}

