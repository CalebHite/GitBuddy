import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function ViewPost({ post, onAvatarClick }) {
  // Construct user object from post data
  const userInfo = {
    name: post.userName,
    email: post.email,
    image: post.img || '/default-avatar.png'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative">

            <DotLottieReact
              src="https://lottie.host/ff8f0355-d3cc-4f44-9036-4869392d6c0a/gwXqvhcWei.lottie"
              loop
              autoplay
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[72%] w-24 h-24"
            />
            <img
              className="w-12 h-12 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity relative"
              src={userInfo.image}
              alt={userInfo.name}
              onClick={() => onAvatarClick(userInfo)}
              title="Click to view profile"
            />
          </div>
          <div>
            <CardTitle className="text-xl font-semibold">{userInfo.name}</CardTitle>
            <h3 className="text-sm text-gray-600">{userInfo.email}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <hr className="my-4 border-gray-200" />
        {post.githubCommit && (
          <div className="mt-4 text-sm text-gray-600">
            <p>{post.githubCommit.repository}</p>
            <p className="font-semibold text-xl">{post.githubCommit.message}</p>
            {post.githubCommit.files && post.githubCommit.files.length > 0 && (
              <>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="font-mono text-sm mb-2">
                    {post.githubCommit.files[post.githubCommit.files.length - 1].filename}
                    ({post.githubCommit.files[post.githubCommit.files.length - 1].status})
                  </p>
                  <p className="text-xs mb-2">
                    +{post.githubCommit.files[post.githubCommit.files.length - 1].additions}
                    -{post.githubCommit.files[post.githubCommit.files.length - 1].deletions} changes
                  </p>
                  <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                    <code className="text-xs">
                      {post.githubCommit.files[post.githubCommit.files.length - 1].patch}
                    </code>
                  </pre>
                </div>
              </>
            )}
            <a href={post.githubCommit.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mt-2 block">
              View on GitHub
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 