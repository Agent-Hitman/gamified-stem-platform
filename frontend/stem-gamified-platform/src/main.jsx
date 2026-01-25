import React from 'react'
import ReactDOM from 'react-dom/client'
import GameApp from './App.jsx' 
import './index.css'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { BrowserRouter } from 'react-router-dom';

// --- CHANGE IS HERE ---
// Access the environment variable using Vite's special object
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Check your .env.local file!")
}

function Root() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      
      <SignedIn>
        <BrowserRouter>
           <GameApp /> 
        </BrowserRouter>
      </SignedIn>
    </ClerkProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)