from stable_baselines3 import PPO
from climate_env import ClimateEnv

env = ClimateEnv()

model = PPO(
    "MlpPolicy",
    env,
    verbose=1
)

# Increased training time for stronger learning
model.learn(total_timesteps=150000)

model.save("climate_policy_model")

print("Training complete and model saved!")