import React from 'react'
import ReactDOM from 'react-dom/client'
import GameApp from './App.jsx' 
import './index.css'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";

// 1. IMPORT BROWSER ROUTER
import { BrowserRouter } from 'react-router-dom';

const PUBLISHABLE_KEY = "pk_test_bG9naWNhbC1qYXdmaXNoLTM1LmNsZXJrLmFjY291bnRzLmRldiQ"; 

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

function Root() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      
      <SignedIn>
        {/* 2. WRAP YOUR APP IN BROWSER ROUTER */}
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