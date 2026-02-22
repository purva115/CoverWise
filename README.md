# CareLess 💙
**Less confusion. Less stress. More care.**

CareLess helps students navigate healthcare costs and billing across the full journey:
1) **Before a visit:** estimate costs + understand coverage (with voice AI explanations)  
2) **After a visit:** upload an EOB/bill and get a plain-English breakdown + next steps  
3) **Community support:** donate to a Student Emergency Fund (Solana + Phantom) and discover free medical camps nearby

---

## ✨ What We Built

### 1) Pre-Visit Budget Forecast (Pre Visit)
**Goal:** Reduce uncertainty before you step into a clinic.

**Flow**
- Upload insurance card (optional in demo)
- Select a condition (dropdown)
- Enter basic plan numbers (deductible / coinsurance / copay)
- Click **Verify & Analyze**
- Get:
  - Total estimate range
  - “You pay” range
  - Clear “why” explanations (deductible vs coinsurance vs copay)
  - AI Assistant **speaks** the summary (ElevenLabs TTS)

---

### 2) Post-Visit EOB/Bill Explainer + Denial Intelligence (Post Visit)
**Goal:** Make confusing medical billing readable and actionable.

**Flow**
- Upload EOB or bill PDF
- We extract service lines and show a simplified breakdown:
  - CPT code → plain English
  - Charge / discount / allowed / paid / patient responsibility
  - Tooltips for billing jargon
- Next actions:
  - Appeal checklist
  - Call script / questions to ask billing office

---

### 3) Community Page (Community)
**Goal:** A student-first safety net + prevention layer.

**Features**
- **Student Emergency Fund donations** (Solana Playground + Phantom wallet)
- **On-chain donation feed** for transparent proof-of-impact
- **Free medical camps near you** (curated/listed in UI)

---

## 🧰 Tech Stack
- **Frontend:** React + Vite
- **UI:** Custom components (cards, meters, breakdown panels, tooltips)
- **AI / Voice:** ElevenLabs Text-to-Speech
- **Document Intelligence:** EOB/Bill PDF extraction + structured parsing
- **Blockchain:** Solana Playground + Phantom Wallet
- **(Optional) Storage:** MongoDB Atlas (if you persist parsed EOBs / donation metadata)

---

## 🏗️ High-Level Architecture
- Client (React) handles UI, file upload, wallet connect
- Backend (API) handles:
  - PDF ingestion + parsing into structured line items
  - cost estimation logic
  - appeal checklist/call script generation (template or AI)
- ElevenLabs TTS generates an audio narration for pre-visit summary
- Solana integration records donation transactions and renders a feed

---

## 🚀 Getting Started

### Prereqs
- Node.js 18+ (recommended)
- Phantom Wallet browser extension (for donations demo)

### Install & Run
```bash
# 1) install
npm install

# 2) run dev
npm run dev
