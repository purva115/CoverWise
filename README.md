💙 CareLess
Less Confusion. Less Stress. More Care.

CareLess is a financial clarity platform designed to help students navigate healthcare costs with confidence.

It supports users before care, after care, and when costs feel overwhelming — combining AI-driven insurance analysis, medical bill simplification, voice assistance, and a community emergency fund powered by Solana.

🚀 Problem

Healthcare billing in the U.S. is confusing, stressful, and financially risky.

Students struggle with:

Estimating treatment costs before visiting a provider

Understanding complex Explanation of Benefits (EOB) documents

Navigating denial codes and appeal processes

Affording unexpected medical expenses

CareLess reduces financial anxiety across all three stages of care.

🧠 Solution Overview

CareLess operates across three phases:

🔵 1. Predict (Pre-Visit Budget Forecast)

User selects condition

Inputs deductible, coinsurance, copay

Receives:

Estimated total cost range

Estimated “you pay” amount

Clear explanation of deductible & coinsurance impact

AI voice assistant narrates the breakdown (ElevenLabs TTS)

🟢 2. Decode (Post-Visit EOB Intelligence)

Upload EOB / hospital bill (PDF)

Extract service line items:

CPT code → Plain English

Charge

Network discount

Allowed amount

Insurance paid

Patient responsibility

Jargon tooltips (deductible, PPO discount, allowed amount, etc.)

“Next Actions”:

Appeal checklist

Call script for billing office

🟣 3. Support (Community & Emergency Fund)

Student Health Emergency Fund

Solana + Phantom wallet integration

On-chain donation feed for transparency

Free medical camps discovery (community events)

🏗 Tech Stack

Frontend

React + Vite

Modern UI components

Responsive layout

Backend

PDF parsing for EOB extraction

Rule-based insurance calculator

Structured data transformation

AI

Gemini API (for structured extraction / assistance)

ElevenLabs (text-to-speech voice narration)

Blockchain

Solana Playground

Phantom Wallet integration

On-chain donation tracking

📂 Project Structure (High-Level)
CareLess/
│
├── src/
│   ├── pages/
│   │   ├── PreVisit.jsx
│   │   ├── PostVisit.jsx
│   │   ├── Community.jsx
│   │
│   ├── components/
│   ├── services/
│   ├── utils/
│
├── public/
├── .env
├── README.md
⚙️ Environment Variables

Create a .env file in the root directory:

VITE_GEMINI_API_KEY=
VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=
VITE_DONATION_WALLET=
VITE_SOLANA_CLUSTER=
🔑 Variable Descriptions

VITE_GEMINI_API_KEY → API key for Gemini AI services

VITE_ELEVENLABS_API_KEY → API key for ElevenLabs TTS

VITE_ELEVENLABS_VOICE_ID → Selected voice ID for narration

VITE_DONATION_WALLET → Solana wallet address for emergency fund

VITE_SOLANA_CLUSTER → Solana cluster (e.g., devnet, mainnet-beta)

⚠️ Never commit your .env file. Add it to .gitignore.

🛠 Installation & Setup
# Clone repository
git clone https://github.com/your-username/careless.git

cd careless

# Install dependencies
npm install

# Run development server
npm run dev

App will run at:

http://localhost:5173
🎬 Demo Flow
1️⃣ Pre-Visit

Select condition

Enter insurance details

Click "Verify & Analyze"

AI assistant narrates cost breakdown

2️⃣ Post-Visit

Upload EOB PDF

View simplified CPT breakdown

Explore appeal checklist

3️⃣ Community

Donate to Student Emergency Fund

View on-chain donation feed

Discover nearby free health camps

🎯 Impact

CareLess aims to:

Reduce financial anxiety before medical visits

Improve billing transparency

Increase successful appeals

Support students through community funding

Make healthcare literacy accessible

🧪 Sample EOB Used in Demo

Example EOB parsing demonstrated using:

EOB_Sep032025.pdf

Extracted:

CPT 99204 → Office Visit

CPT 28470 → Fracture Treatment

Deductible impact

PPO discounts

Patient responsibility

👥 Team

Built at [Hackathon Name]
Team: [Add names]

🏆 Vision

Healthcare shouldn't require a finance degree to understand.

CareLess transforms complex insurance systems into clear, human-readable insights — empowering students to make informed decisions and reducing stress at every stage of care.
