# 🚀 Groq API via Vercel Proxy – Setup Guide

This document explains the step-by-step process to call Groq APIs using a Vercel-hosted proxy endpoint.

---

## 📌 Overview

Instead of calling Groq directly, we route requests through a Vercel-hosted proxy. This helps in:

* Avoiding CORS issues
* Securing API keys
* Enabling flexible backend control

---

## 🔗 Reference Repository

GitHub Repo:
https://github.com/aswingt65/groq-chat-proxy

---

## 🛠️ Setup Steps

### 1. Fork the Repository

* Go to the repository link above
* Click on **Fork**
* This will create a copy in your GitHub account

---

### 2. Deploy to Vercel

* Go to https://vercel.com
* Sign in with your GitHub account
* Click **"Add New Project"**
* Select your forked repository
* Deploy the project

---

### 3. Verify Deployment

Once deployed:

* Open your Vercel project URL
* Ensure the API endpoint is reachable

Example:

```id="ex1"
https://your-project-name.vercel.app/api/proxy/groq
```

---

### 4. Disable Vercel Authentication

By default, Vercel may block external API access.

To disable:

**Navigate in Vercel dashboard:**

```
Your Project → Settings → Deployment Protection → Vercel Authentication → Turn Off → Save
```

✅ This allows local or external systems to call your endpoint

---

### 5. Use the Proxy Endpoint Locally

Use the Groq Python SDK and point it to your Vercel proxy.

#### 📄 Example: `groq-local.py`

```python id="ex2"
import os
from groq import Groq

# Configure client to use Vercel proxy
client = Groq(
    api_key="your_api_key",
    base_url="https://your-project-name.vercel.app/api/proxy/groq",
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models.",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)
```

---

## 🔑 Key Notes

* Replace:

  * `your_api_key` → Your Groq API Key
  * `your-project-name` → Your Vercel deployment URL
* Ensure your Vercel deployment is public
* Make sure the endpoint path is exactly:

  ```
  /api/proxy/groq
  ```

---

## ✅ Final Endpoint Format

```id="ex3"
https://your-project-name.vercel.app/api/proxy/groq
```

---

## 🎯 Summary

| Step | Action                   |
| ---- | ------------------------ |
| 1    | Fork the repo            |
| 2    | Deploy on Vercel         |
| 3    | Verify deployment        |
| 4    | Disable authentication   |
| 5    | Use endpoint in Groq SDK |

---

## 🚀 Outcome

You now have:

* A working Groq proxy hosted on Vercel
* A callable endpoint from local or external apps
* A flexible setup for LLM integration

---

If you want, I can extend this with:

* Architecture diagram
* Request/response flow
* Error handling & debugging tips
