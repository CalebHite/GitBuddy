import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PostPreview({ post }) {
  return (
    <Card>
      <CardHeader>
        <img className="w-1/2" src={post.img}></img>
        <CardTitle className="text-xl font-semibold mb-2">{post.userName}</CardTitle>
        <h3 className="text-sm">{post.email}</h3>
      </CardHeader>
      <CardContent>
        <h1 className=""></h1>
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
  )
}

