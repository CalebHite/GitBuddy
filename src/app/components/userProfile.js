"use client"

export default function UserProfile({ user }) {
  if (!user) return null;
  
  return (
    <div className="p-4 border rounded">
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
}
