# 🌍 AI Climate Policy Simulator

An intelligent climate policy simulation platform built using **FastAPI**, **React**, **Reinforcement Learning**, and **Multi-Agent AI** to model long-term environmental and economic outcomes.

---

## 🚀 Overview

This project simulates how government climate policies impact:

- Carbon emissions  
- Economic growth (GDP)  
- Renewable energy adoption  
- Long-term sustainability  
- Crisis resilience (economic crashes & climate disasters)

Users can manually create policies or allow an AI agent to optimize them automatically.

---

## ✨ Key Features

### 🧾 Manual Policy Mode

Set your own:

- Carbon Tax  
- Renewable Subsidy  
- Simulation Years  

### 🤖 AI Auto Policy Mode

A trained Reinforcement Learning agent dynamically adjusts policies every year for better results.

### ⚠️ Crisis Mode

Random real-world shocks are introduced:

- Climate disasters increase emissions  
- Economic crashes reduce GDP growth  

### 🛣️ Policy Roadmap

Create phased long-term strategies.

Example:

- Years 0–19 → Soft rollout  
- Years 20–50 → Aggressive climate action  

### 📊 Dashboard & Visualizations

- Emission trends  
- GDP comparison  
- Reward curves  
- Policy performance charts  

---

## 🛠️ Tech Stack

### Frontend

- React.js  
- Vite  
- CSS  

### Backend

- FastAPI  
- Python  

### AI / Machine Learning

- Reinforcement Learning (PPO)  
- Stable-Baselines3  
- Multi-Agent System  

### Data

- Climate datasets  
- CO₂ historical records  

---

## 📂 Project Structure

```text
ClimatePolicy-AI/
│── backend/
│── frontend/
│── data/
│── README.md
│── .gitignore

## ⚙️ Installation & Run

### Backend

pip install -r requirements.txt
uvicorn api:app --reload

### Frontend

cd frontend
npm install
npm run dev
