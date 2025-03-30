"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PostPreview({ post }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <img
            className="w-12 h-12 rounded-full object-cover"
            src={post.img || "/placeholder.svg"}
            alt={post.userName}
          />
          <div>
            <CardTitle className="text-xl font-semibold">{post.userName}</CardTitle>
            <h3 className="text-sm text-gray-600">{post.email}</h3>
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
                    {post.githubCommit.files[post.githubCommit.files.length - 1].filename}(
                    {post.githubCommit.files[post.githubCommit.files.length - 1].status})
                  </p>
                  <p className="text-xs mb-2">
                    +{post.githubCommit.files[post.githubCommit.files.length - 1].additions}-
                    {post.githubCommit.files[post.githubCommit.files.length - 1].deletions} changes
                  </p>
                  <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                    <code className="text-xs">{post.githubCommit.files[post.githubCommit.files.length - 1].patch}</code>
                  </pre>

                  <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="flex flex-row">
                        <p className="text-md font-medium mr-2" style={{
                          background: "linear-gradient(90deg, #8B5CF6, #3B82F6)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          marginRight: "5px",
                      }}>Summary</p>
                      <img 
                        src="/google-gemini-icon.webp" 
                        alt="Gemini Icon" 
                        width={20} 
                        height={20}
                        style={{ background: "none" }}
                      ></img>
                      </span>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="sr-only">Toggle summary</span>
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <p>{post.githubCommit.summary}</p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </>
            )}
            <a
              href={post.githubCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline mt-2 block"
            >
              View on GitHub
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

