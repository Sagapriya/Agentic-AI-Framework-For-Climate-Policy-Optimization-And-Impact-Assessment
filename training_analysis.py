import matplotlib.pyplot as plt
import numpy as np

# Example: if you saw ep_rew_mean printed during training,
# manually copy 20-30 values from console into this list

rewards = [
    -250, -200, -150, -100, -50,
    0, 10, 20, 30, 40, 45, 47
]

plt.plot(rewards)
plt.title("Training Reward Improvement")
plt.xlabel("Training Iterations")
plt.ylabel("Mean Episode Reward")
plt.grid(True)
plt.savefig("training_curve.png")
plt.show()