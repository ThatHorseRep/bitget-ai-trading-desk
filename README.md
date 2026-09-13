# Bitget AI RedTeam Desk

Implementation workspace for the **Bitget AI Base Camp Hackathon S2**.

## About the Project
Bitget AI RedTeam Desk is a pre-trade decision-support product designed specifically for the unique structural risks of tokenized U.S. equities on Bitget. It acts as an adversarial "Red Team" against a user's proposed trade, isolating fundamental market rationale from off-hours execution risk and stressing the position mathematically before capital is deployed.

For full details on the project, the target user, the core job, and the role of the LLM, please see the [SUBMISSION.md](./SUBMISSION.md) file.

## Getting Started

### Prerequisites
- Node.js 18+ (20+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Configuration
Copy the example environment file and add your Gemini API Key:
```bash
cp .env.example .env.local
```
Update `.env.local` with your `LLM_API_KEY`. (The app uses the Gemini free tier by default).

### Running the Application (UI)
Start the Next.js development server to interact with the UI:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. 
To test the Hackathon "Demo Wedge" (Off-Hours Trading), click the **"Official scenario"** button in the UI.

### Running Tests
The deterministic engine and LLM integration can be tested using the automated test suite:
```bash
npm run test
```
*(Note: If you encounter a `429 Too Many Requests` error, you have hit the Gemini API free tier rate limit. Wait 60 seconds and try again, or test manually via the UI).*

## Architecture & Specifications
The official product specs and architecture documents (B01-B06) are located in the root directory. Early research drafts and planning notes have been archived in the `docs/archive/` folder.


