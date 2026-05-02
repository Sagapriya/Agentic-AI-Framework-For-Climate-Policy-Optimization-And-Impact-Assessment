import matplotlib.pyplot as plt
import numpy as np
from stable_baselines3 import PPO
from climate_env import ClimateEnv
from climate_simulation import ClimateSimulation

# -----------------------------
# Load trained RL model
# -----------------------------
model = PPO.load("climate_policy_model")

# -----------------------------
# RL POLICY SIMULATION
# -----------------------------
env = ClimateEnv()
obs, _ = env.reset()

rl_emissions = []
rl_rewards = []

for _ in range(50):
    action, _ = model.predict(obs)
    obs, reward, done, _, _ = env.step(action)

    rl_emissions.append(obs[0])
    rl_rewards.append(reward)

    if done:
        break


# -----------------------------
# MODERATE STATIC POLICY (5,2)
# -----------------------------
static_sim = ClimateSimulation()

static_emissions = []
static_rewards = []

for _ in range(50):
    result = static_sim.step(carbon_tax=5, renewable_subsidy=2)
    reward = static_sim.compute_reward()

    static_emissions.append(result["emissions"])
    static_rewards.append(reward)


# -----------------------------
# AGGRESSIVE STATIC POLICY (10,5)
# -----------------------------
aggressive_sim = ClimateSimulation()

aggressive_emissions = []
aggressive_rewards = []

for _ in range(50):
    result = aggressive_sim.step(carbon_tax=10, renewable_subsidy=5)
    reward = aggressive_sim.compute_reward()

    aggressive_emissions.append(result["emissions"])
    aggressive_rewards.append(reward)


# -----------------------------
# EMISSIONS PLOT
# -----------------------------
plt.figure()
plt.plot(rl_emissions, label="RL Policy")
plt.plot(static_emissions, label="Static Policy (5,2)")
plt.plot(aggressive_emissions, label="Aggressive Static (10,5)")
plt.xlabel("Time Steps")
plt.ylabel("Emissions")
plt.title("Emissions Comparison: RL vs Static Policies")
plt.legend()
plt.grid(True)

plt.savefig("emission_comparison.png")
plt.show()


# -----------------------------
# REWARD PLOT
# -----------------------------
plt.figure()
plt.plot(rl_rewards, label="RL Policy")
plt.plot(static_rewards, label="Static Policy (5,2)")
plt.plot(aggressive_rewards, label="Aggressive Static (10,5)")
plt.xlabel("Time Steps")
plt.ylabel("Reward")
plt.title("Reward Comparison: RL vs Static Policies")
plt.legend()
plt.grid(True)

plt.savefig("reward_comparison.png")
plt.show()


# -----------------------------
# FINAL EMISSION SUMMARY
# -----------------------------
print("\nFinal Emissions After 50 Steps:")
print("RL Policy:", round(rl_emissions[-1], 3))
print("Static Policy (5,2):", round(static_emissions[-1], 3))
print("Aggressive Static (10,5):", round(aggressive_emissions[-1], 3))

print("\nGraphs saved as:")
print(" - emission_comparison.png")
print(" - reward_comparison.png")