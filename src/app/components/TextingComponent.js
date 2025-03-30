"use client";

import React, { useEffect, useState } from "react";
import Peer from "peerjs";

const TextingComponent = ({ userId }) => {
  const [peer, setPeer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connectedPeerId, setConnectedPeerId] = useState("");

  useEffect(() => {
    // Initialize PeerJS
    const newPeer = new Peer(userId);
    setPeer(newPeer);

    newPeer.on("open", (id) => {
      console.log("My peer ID is: " + id);
    });

    newPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        setMessages((prevMessages) => [...prevMessages, data]);
      });
    });

    return () => {
      newPeer.destroy();
    };
  }, [userId]);

  const connectToPeer = () => {
    const conn = peer.connect(connectedPeerId);
    conn.on("open", () => {
      console.log("Connected to peer: " + connectedPeerId);
    });
    conn.on("data", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });
  };

  const sendMessage = () => {
    if (input && peer) {
      const conn = peer.connections[connectedPeerId][0]; // Get the connection to the specified peer
      if (conn) {
        conn.send(input);
        setMessages((prevMessages) => [...prevMessages, input]);
        setInput("");
      }
    }
  };

  return (
    <div>
      <h2>Texting Component</h2>
      <input
        type="text"
        value={connectedPeerId}
        onChange={(e) => setConnectedPeerId(e.target.value)}
        placeholder="Enter peer ID to connect"
      />
      <button onClick={connectToPeer}>Connect</button>
      <div>
        <h3>Messages</h3>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default TextingComponent; 