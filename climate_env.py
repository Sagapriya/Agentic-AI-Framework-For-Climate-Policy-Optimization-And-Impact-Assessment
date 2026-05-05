import gymnasium as gym
from gymnasium import spaces
import numpy as np
from multi_agent_system import ClimateSystem


class ClimateEnv(gym.Env):
    def __init__(self):
        super(ClimateEnv, self).__init__()

        self.system = ClimateSystem()

        self.action_space = spaces.Box(
            low=np.array([0.0, 0.0], dtype=np.float32),
            high=np.array([50.0, 50.0], dtype=np.float32),
            dtype=np.float32,
        )

        self.observation_space = spaces.Box(
            low=np.array([0.0, 0.0, 0.0, 0.0], dtype=np.float32),
            high=np.array([np.inf, np.inf, 1.0, 1.0], dtype=np.float32),
            dtype=np.float32,
        )

        self.max_steps = 50
        self.current_step = 0

    def reset(self, seed=None, options=None):
        self.system = ClimateSystem()
        self.current_step = 0

        state = np.array([
            self.system.environment.emissions,
            self.system.industry.production,
            self.system.environment.renewable_share,
            self.system.citizen.acceptance
        ], dtype=np.float32)
        return state, {}

    def step(self, action):
        carbon_tax = float(action[0])
        renewable_subsidy = float(action[1])

        state, reward = self.system.step(carbon_tax, renewable_subsidy)

        self.current_step += 1
        done = self.current_step >= self.max_steps

        return state, reward, done, False, {}

    def render(self):
        pass