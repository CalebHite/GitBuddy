"use client"

import { useEffect, useState } from "react"
import Peer from "peerjs"
import { Send, Link, Loader2, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const TextingComponent = ({ userId, otherUserId }) => {
  const [peer, setPeer] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [connectedPeerId, setConnectedPeerId] = useState("")
  const [peerIdToConnect, setPeerIdToConnect] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")
  const [activeConnection, setActiveConnection] = useState(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [myid, setMyId] = useState("");

  useEffect(() => {
    // Initialize PeerJS
    const newPeer = new Peer(userId)
    setPeer(newPeer)

    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id)
      // Automatically connect to the other user
      setMyId(id);
      connectToPeer()
    })

    newPeer.on("connection", (conn) => {
      setConnectionStatus("connected")
      setConnectedPeerId(conn.peer)
      setActiveConnection(conn)

      conn.on("data", (data) => {
        setMessages((prevMessages) => [...prevMessages, { text: data, sender: "peer", timestamp: new Date() }])
      })

      conn.on("close", () => {
        setConnectionStatus("disconnected")
        setConnectedPeerId("")
        setActiveConnection(null)
      })
    })

    newPeer.on("error", (err) => {
      console.error("PeerJS error:", err)
      setConnectionStatus("disconnected")
    })

    return () => {
      newPeer.destroy()
    }
  }, [userId])

  const connectToPeer = () => {
    if (!peer || !otherUserId) return

    setIsConnecting(true)
    setConnectionStatus("connecting")

    const conn = peer.connect(otherUserId)

    conn.on("open", () => {
      console.log("Connected to peer: " + otherUserId)
      setConnectedPeerId(otherUserId)
      setConnectionStatus("connected")
      setActiveConnection(conn)
      setIsConnecting(false)
    })

    conn.on("data", (data) => {
      setMessages((prevMessages) => [...prevMessages, { text: data, sender: "peer", timestamp: new Date() }])
    })

    conn.on("close", () => {
      setConnectionStatus("disconnected")
      setConnectedPeerId("")
      setActiveConnection(null)
    })

    conn.on("error", (err) => {
      console.error("Connection error:", err)
      setIsConnecting(false)
      setConnectionStatus("disconnected")
    })
  }

  const sendMessage = () => {
    if (input.trim() && activeConnection) {
      activeConnection.send(input)
      setMessages((prevMessages) => [...prevMessages, { text: input, sender: "me", timestamp: new Date() }])
      setInput("")
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Card className="w-full max-w-md mx-4 shadow-lg">
      <CardHeader className="border-b bg-muted/50 flex items-center justify-between">
        <div className="flex items-center">
          <CardTitle className="text-xl">Chat</CardTitle>
          <Badge variant={connectionStatus === "connected" ? "success" : "secondary"}>
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
          </Badge>
        </div>
        <button onClick={() => setIsMinimized(!isMinimized)} className="focus:outline-none">
          {isMinimized ? <ChevronUp className="h-5 w-5 cursor-pointer" /> : <ChevronDown className="h-5 w-5 cursor-pointer" />}
        </button>
      </CardHeader>

      {!isMinimized && (
        <>
          <div className="text-sm text-muted-foreground">
            <p className="ml-2">Your ID:{" "}</p>
            <Badge variant="outline" className="ml-1 font-mono">
              {myid}
            </Badge>
          </div>

          <CardContent className="p-0">
            <ScrollArea className="h-[350px] p-4">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">No messages yet</div>
              ) : (
                <div className="space-y-4 pt-4">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-lg ${
                          msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <div className="break-words">{msg.text}</div>
                        <div
                          className={`text-xs mt-1 ${
                            msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>

          <Separator />

          <CardFooter className="p-3">
            <div className="flex w-full items-center space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message"
                disabled={connectionStatus !== "connected"}
              />
              <Button onClick={sendMessage} disabled={!input.trim() || connectionStatus !== "connected"} size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </CardFooter>
        </>
      )}
      {isMinimized && (
        <div className="text-sm text-muted-foreground text-center px-2">
          Chat minimized. Click to expand.
        </div>
      )}
    </Card>
  )
}

export default TextingComponent

