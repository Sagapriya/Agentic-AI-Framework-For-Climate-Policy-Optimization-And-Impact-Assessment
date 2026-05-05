import numpy as np
import pandas as pd

# Global cache for data (New Optimization)
_CO2_DATA_CACHE = None

# -----------------------------
# SECTOR AGENTS (New Feature 3)
# -----------------------------
class SectorAgent:
    def __init__(self, name, baseline_emissions, emission_factor, gdp_factor):
        self.name = name
        self.emissions = baseline_emissions
        self.emission_factor = emission_factor
        self.gdp_factor = gdp_factor
        self.production = 1000

    def respond(self, carbon_tax, renewable_subsidy, crisis_mode=False):
        # Sector specific response
        tax_sensitivity = self.emission_factor * 0.002
        subsidy_boost = self.gdp_factor * 0.001
        
        # Crisis impact (New Feature 4)
        crisis_shock = 1.0
        if crisis_mode and np.random.random() < 0.2:
            crisis_shock = 1.2 # 20% spike in emissions due to crisis

        reduction = (tax_sensitivity * carbon_tax + subsidy_boost * renewable_subsidy) * 0.1
        self.emissions *= (1 - reduction) * crisis_shock
        self.emissions = max(self.emissions, 0.05)
        
        growth = 0.01 + (subsidy_boost * renewable_subsidy * 0.01) - (tax_sensitivity * carbon_tax * 0.005)
        if crisis_mode and np.random.random() < 0.1:
            growth -= 0.05 # GDP crash
            
        self.production *= (1 + growth)
        return self.emissions, self.production

# -----------------------------
# CITIZEN AGENT
# -----------------------------
class CitizenAgent:
    def __init__(self):
        self.acceptance = 0.8

    def respond(self, carbon_tax, renewable_subsidy):
        target_acceptance = 1.0 - (carbon_tax / 100.0) + (renewable_subsidy / 150.0)
        target_acceptance = np.clip(target_acceptance, 0, 1)
        self.acceptance += 0.1 * (target_acceptance - self.acceptance)
        return self.acceptance

# -----------------------------
# CLIMATE SYSTEM (Upgraded for Sectors & Globe)
# -----------------------------
class ClimateSystem:
    def __init__(self, country="India", seed=None):
        self.country = country
        self.cumulative_emissions = 0
        self.temperature_rise = 0.0 # New Feature 1 (for Globe)
        
        if seed is not None:
            np.random.seed(seed)

        # Load real baseline data (Optimized with caching)
        global _CO2_DATA_CACHE
        try:
            if _CO2_DATA_CACHE is None:
                _CO2_DATA_CACHE = pd.read_csv("data/owid-co2-data.csv")
            
            df = _CO2_DATA_CACHE
            country_df = df[df["country"] == country].dropna(subset=["co2_per_capita", "gdp"])
            latest = country_df.iloc[-1]
            real_emission = float(latest["co2_per_capita"])
            real_gdp = float(latest["gdp"])
        except Exception as e:
            print(f"Error loading data: {e}")
            real_emission, real_gdp = 5.0, 3e12

        # Initialize Sector Agents (Feature 3)
        self.sectors = {
            "Energy": SectorAgent("Energy", real_emission * 0.4, 1.5, 0.8),
            "Industry": SectorAgent("Industry", real_emission * 0.3, 1.2, 1.2),
            "Transport": SectorAgent("Transport", real_emission * 0.2, 1.0, 0.6),
            "Agriculture": SectorAgent("Agriculture", real_emission * 0.1, 0.8, 0.4)
        }
        
        for s in self.sectors.values():
            s.production = real_gdp / 4

        self.citizen = CitizenAgent()
        self.initial_emissions = real_emission

    def step(self, carbon_tax, renewable_subsidy, crisis_mode=False):
        total_emissions = 0
        total_gdp = 0
        sector_data = {}

        # Update Sectors
        for name, sector in self.sectors.items():
            e, p = sector.respond(carbon_tax, renewable_subsidy, crisis_mode)
            total_emissions += e
            total_gdp += p
            sector_data[name] = {"emissions": e, "production": p}

        # Update Citizen
        acceptance = self.citizen.respond(carbon_tax, renewable_subsidy)

        # Global Temperature Tracking (Feature 1 Support)
        self.cumulative_emissions += total_emissions
        # Simple climate sensitivity model: 0.0001 degrees per cumulative unit
        self.temperature_rise = self.cumulative_emissions * 0.005 

        # Renewable share logic
        renewable_share = min(1.0, 0.2 + (renewable_subsidy / 60.0) + (carbon_tax / 80.0))

        # Reward Calculation
        emission_improvement = (self.initial_emissions - total_emissions) * 25
        gdp_reward = total_gdp / 1e12
        total_reward = emission_improvement + gdp_reward + (1.2 * acceptance)

        state = np.array([total_emissions, total_gdp, renewable_share, acceptance], dtype=np.float32)

        return {
            "state": state,
            "reward": total_reward,
            "temp_rise": self.temperature_rise,
            "sectors": sector_data
        }