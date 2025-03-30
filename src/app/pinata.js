const axios = require('axios');
const FormData = require('form-data');

// Replace these with your Pinata API credentials
const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;
const PINATA_BASE_URL = 'https://api.pinata.cloud';


// Upload JSON data to IPFS with unique ID
export async function uploadJsonToIPFS(jsonData, uniqueId) {
    const uid = generateUniqueId('uid-');
    try {
        const pinataMetadata = {
            name: `${jsonData.name || 'JSON Data'}`,
            keyvalues: {
                uniqueId: uid
            }
        };

        const response = await axios.post(
            `${PINATA_BASE_URL}/pinning/pinJSONToIPFS`,
            {
                pinataMetadata,
                pinataContent: jsonData
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            uniqueId: uid
        };
    } catch (error) {
        console.error('Error uploading JSON to IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Upload file to IPFS with unique ID
export async function uploadFileToIPFS(file, uniqueId) {
    const uid = generateUniqueId('uid-');
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        // Add metadata
        const metadata = JSON.stringify({
            name: `Image File`,
            keyvalues: {
                uniqueId: uid
            }
        });
        formData.append('pinataMetadata', metadata);

        const response = await axios.post(
            `${PINATA_BASE_URL}/pinning/pinFileToIPFS`,
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        return {
            success: true,
            ipfsHash: response.data.IpfsHash,
            uniqueId: uid
        };
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Fetch all items from IPFS
export async function fetchAllFromIPFS() {
    try {
        const response = await axios.get(
            `${PINATA_BASE_URL}/data/pinList`,
            {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );

        // Check if the response has the expected structure
        if (response.data && Array.isArray(response.data.rows)) {
            return {
                success: true,
                data: response.data.rows // Return just the rows array
            };
        } else {
            console.error("Unexpected response structure:", response.data);
            return {
                success: false,
                message: "Invalid response structure from Pinata"
            };
        }
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Fetch specific item from IPFS by hash
export async function fetchFromIPFS(ipfsHash) {
    try {
        const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Fetch items from IPFS by unique ID
export async function fetchFromIPFSById(uniqueId) {
    try {
        const response = await axios.get(
            `${PINATA_BASE_URL}/data/pinList`,
            {
                params: {
                    metadata: JSON.stringify({
                        keyvalues: {
                            uniqueId: {
                                value: uniqueId,
                                op: 'eq'
                            }
                        }
                    })
                },
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );
        
        if (response.data.rows.length === 0) {
            return {
                success: false,
                message: 'No items found with this ID'
            };
        }

        // Fetch the actual content for the first matching item
        const ipfsHash = response.data.rows[0].ipfs_pin_hash;
        const contentResponse = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
        
        return {
            success: true,
            data: contentResponse.data,
            metadata: response.data.rows[0].metadata
        };
    } catch (error) {
        console.error('Error fetching from IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Delete item from IPFS by uniqueId
export async function deleteFromIPFSById(uniqueId) {
    try {
        // First, find the item by uniqueId
        const response = await axios.get(
            `${PINATA_BASE_URL}/data/pinList`,
            {
                params: {
                    metadata: JSON.stringify({
                        keyvalues: {
                            uniqueId: {
                                value: uniqueId,
                                op: 'eq'
                            }
                        }
                    })
                },
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );

        if (response.data.rows.length === 0) {
            return {
                success: false,
                message: 'No items found with this ID'
            };
        }

        // Get the IPFS hash and unpin the file
        const ipfsHash = response.data.rows[0].ipfs_pin_hash;
        await axios.delete(
            `${PINATA_BASE_URL}/pinning/unpin/${ipfsHash}`,
            {
                headers: {
                    'pinata_api_key': PINATA_API_KEY,
                    'pinata_secret_api_key': PINATA_SECRET_KEY
                }
            }
        );

        return {
            success: true,
            message: 'File unpinned successfully',
            deletedHash: ipfsHash
        };
    } catch (error) {
        console.error('Error deleting from IPFS:', error);
        return {
            success: false,
            message: error.message
        };
    }
}

// Helper function to generate unique IDs
function generateUniqueId(prefix = '') {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}-${randomStr}`;
}