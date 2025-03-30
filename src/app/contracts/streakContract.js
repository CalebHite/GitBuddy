export const STREAK_CONTRACT_ADDRESS = "0x0b0485F0807262d3D819068e1AD16F66d4cca47c";

export const STREAK_CONTRACT_ABI = [
	{
		"inputs": [],
		"name": "post",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "hrs",
				"type": "uint256"
			}
		],
		"name": "skipHours",
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