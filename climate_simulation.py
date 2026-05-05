import numpy as np

class ClimateSimulation:
    def __init__(self):
        self.initial_emissions = 2.0
        self.emissions = 2.0
        self.gdp = 3000
        self.renewable_share = 0.2
        self.acceptance = 0.8

    def step(self, carbon_tax, renewable_subsidy):

        # Emissions respond gradually
        emission_reduction = 0.002 * carbon_tax + 0.003 * renewable_subsidy
        self.emissions *= (1 - emission_reduction)
        self.emissions = max(self.emissions, 0.5)

        # GDP impact
        gdp_change = -0.2 * carbon_tax + 0.3 * renewable_subsidy
        self.gdp += gdp_change
        self.gdp = max(self.gdp, 1000)

        # Renewable growth
        self.renewable_share += 0.0005 * renewable_subsidy
        self.renewable_share = min(self.renewable_share, 1)

        # Public acceptance impact
        self.acceptance -= 0.001 * carbon_tax
        self.acceptance = max(min(self.acceptance, 1), 0)

        return {
            "emissions": round(self.emissions, 3),
            "gdp": round(self.gdp, 2),
            "renewable_share": round(self.renewable_share, 3),
            "acceptance": round(self.acceptance, 3)
        }

    def compute_reward(self):
        """
        Reward emission reduction relative to baseline.
        Encourages long-term improvement.
        """

        # Emission improvement relative to initial baseline
        emission_improvement = (self.initial_emissions - self.emissions) * 20

        gdp_reward = 0.001 * self.gdp
        acceptance_reward = 1.0 * self.acceptance

        total_reward = emission_improvement + gdp_reward + acceptance_reward

        return round(total_reward, 3)