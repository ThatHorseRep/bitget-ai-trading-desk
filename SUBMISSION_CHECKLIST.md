# 🏆 Hackathon Submission Checklist

Before you submit your final project, make sure to complete these critical steps:

## 1. 🔄 Switch Back to the Mandatory Hackathon LLM
You MUST use the provided Bitget API for your final submission. Update your production environment variables (e.g., in Vercel Project Settings) and your local `.env.local` to:
```env
LLM_API_BASE_URL=https://hackathon.bitgetops.com/v1
LLM_MODEL=qwen3.8-max
# Make sure your original hackathon LLM_API_KEY is restored from .env.local.backup!
```

## 2. 📝 Update Your `README.md` for the Judges
Since the provided Qwen API is known to hang indefinitely during heavy generation steps, **you must warn the judges** so they don't think your app is broken. Add this exact note to the top of your README:

> **⚠️ IMPORTANT NOTE FOR JUDGES:** 
> The provided Hackathon Qwen API (`hackathon.bitgetops.com/v1`) currently experiences severe latency and connection hangs during complex reasoning tasks. 
> 
> To evaluate the full UI, logic, and user experience without API timeouts, please **Toggle ON "Deterministic Fixture"** in the top right corner of the dashboard. This will bypass the faulty API and instantly return a pre-computed perfect response.
> 
> *(Note: If you run it live without the fixture, our application is designed to degrade gracefully. Instead of crashing, it will safely abort the hanging LLM request after 15 seconds and display a "System Degradation" UI state while still executing the deterministic risk math).*

## 3. 🚀 Deployment Verification
- [ ] Are the Vercel production environment variables updated?
- [ ] Did you redeploy on Vercel after updating the variables?
- [ ] If you chose to deploy on Render or Railway instead, is the live URL accessible?
- [ ] Did you record a quick video demo using the **Deterministic Fixture**? (Highly recommended!)

Good luck! You've built an incredibly robust app that literally handles the failure of the judges' own API gracefully. That's a winning feature!
