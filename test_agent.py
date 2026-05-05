from stable_baselines3 import PPO
from climate_env import ClimateEnv

# Load trained model
model = PPO.load("climate_policy_model")

env = ClimateEnv()
obs, _ = env.reset()

print("Testing trained agent...\n")

for step in range(10):
    action, _ = model.predict(obs)
    obs, reward, done, _, _ = env.step(action)

    print(f"Step {step+1}")
    print("  Action (tax, subsidy):", action)
    print("  State:", obs)
    print("  Reward:", reward)
    print()

    if done:
        break