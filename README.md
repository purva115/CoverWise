# 💙 CareLess  
### Less Confusion. Less Stress. More Care.

CareLess is a financial clarity platform built for students navigating healthcare costs in the U.S.

It helps users:

- 🔵 Predict costs before a hospital visit  
- 🟢 Decode confusing medical bills after care  
- 🟣 Access community-backed financial support  

---

## 🚨 The Problem

Healthcare billing is complex and stressful — especially for students.

Common pain points:
- Not knowing how much a treatment will cost
- Confusing Explanation of Benefits (EOB) documents
- CPT codes and insurance jargon
- Surprise out-of-pocket expenses
- Difficulty navigating appeals
- Limited emergency financial support

CareLess reduces financial anxiety across every stage of care.

---

## 🧠 What CareLess Does

### 🔵 1. Pre-Visit Budget Forecast

Users:
- Select a condition
- Enter insurance basics (deductible, coinsurance, copay)
- Choose provider (in-network / out-of-network)

CareLess returns:
- Estimated total cost range
- Estimated “you pay” amount
- Clear explanation of deductible & coinsurance impact
- Denial risk indicator

🎙 Integrated with ElevenLabs text-to-speech — the AI assistant narrates the breakdown for better accessibility.

---

### 🟢 2. Post-Visit EOB / Bill Explainer

Upload an EOB or hospital bill (PDF).

CareLess:
- Extracts CPT service lines
- Translates CPT codes into plain English
- Breaks down:
  - Billed charge
  - Network discount
  - Allowed amount
  - Insurance paid
  - Patient responsibility
- Provides jargon tooltips (deductible, PPO discount, coinsurance, etc.)
- Generates:
  - Appeal checklist
  - Call script template for billing office

---

### 🟣 3. Community & Emergency Support

- Student Health Emergency Fund
- Solana + Phantom wallet integration
- On-chain donation transparency
- Free medical camp discovery (community events)

---

## 🏗 Tech Stack

**Frontend**
- React + Vite

**AI**
- Gemini API
- ElevenLabs (Text-to-Speech)

**PDF Processing**
- Structured extraction from uploaded EOB documents

**Blockchain**
- Solana (Phantom wallet integration)
- On-chain donation feed

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=
VITE_ELEVENLABS_API_KEY=
VITE_ELEVENLABS_VOICE_ID=
VITE_DONATION_WALLET=
VITE_SOLANA_CLUSTER=
