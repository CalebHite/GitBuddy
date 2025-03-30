import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center min-h-screen justify-center overflow-hidden">
      <img src="/favicon.png" className="w-1/4" alt="Favicon" />
      <h1 className="text-2xl font-bold">Welcome to GitBuddy</h1>
      <h2 className="text-gray-600">Sign in with your GitHub account to get started.</h2>
      <button
        onClick={() => signIn('github')}
        className="px-4 py-2 bg-gray-800 text-white rounded cursor-pointer hover:bg-gray-700 transition-colors"
      >
        Login
      </button>
    </div>
  );
} 