import { useEffect, useState } from 'react';
import { fetchAllFromIPFS, fetchFromIPFS } from '../pinata';

const UserProfile = ({ user, isCurrentUser = false }) => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        // Fetch all pinned items
        const response = await fetchAllFromIPFS();
        
        if (response.success) {
          // Filter posts by user's email in metadata and fetch content
          const userPostPromises = response.data
            .filter(item => {
              // Check if the item has metadata and matches the user's email
              console.log(item.metadata?.keyvalues?.userEmail === user?.email);
              return item.metadata?.keyvalues?.userEmail === user?.email;
            })
            .map(async (item) => {
              // Fetch the actual content for each post
              const contentResponse = await fetchFromIPFS(item.ipfs_pin_hash);
              return {
                ...contentResponse.data,
                timestamp: item.date_pinned,
                ipfsHash: item.ipfs_pin_hash
              };
            });

          const posts = await Promise.all(userPostPromises);
          setUserPosts(posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchUserPosts();
    }
  }, [user?.email]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-4 border rounded-lg bg-gray-50">
      {/* User Info Section */}
      <div className="flex items-center gap-4 mb-6">
        {user?.image && (
          <img src={user.image} alt="Profile" className="w-12 h-12 rounded-full" />
        )}
        <div>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>
      </div>

      {/* Only show Sign Out button if it's the current user's profile */}
      {isCurrentUser && (
        <button
          onClick={() => signOut()}
          className="mb-6 px-4 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700"
        >
          Sign Out
        </button>
      )}

      {/* Posts Section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">
          {isCurrentUser ? 'Your Posts' : 'Posts'}
        </h3>
        {loading ? (
          <p className="text-gray-600">Loading your posts...</p>
        ) : userPosts.length > 0 ? (
          <div className="space-y-4">
            {userPosts.map((post, index) => (
              <div key={post.ipfsHash} className="border rounded p-4 bg-white">
                <h4 className="font-medium">{post.title}</h4>
                <p className="text-gray-600 mt-2">{post.content}</p>
                <p className="text-sm text-gray-400 mt-2">
                  Posted on: {new Date(post.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No posts found.</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
