from llm import generate_llm_insights
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from stable_baselines3 import PPO
from multi_agent_system import ClimateSystem
from climate_env import ClimateEnv
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Climate Policy System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PolicyStage(BaseModel):
    year_start: int
    year_end: int
    carbon_tax: float
    renewable_subsidy: float

class SimulationRequest(BaseModel):
    carbon_tax: float # Default for legacy/simple mode
    renewable_subsidy: float
    mode: str
    crisis_mode: Optional[bool] = False # Feature 4
    roadmap: Optional[List[PolicyStage]] = None # Feature 2


@app.post("/simulate")
def simulate(request: SimulationRequest):
    mode = request.mode
    crisis_mode = request.crisis_mode
    
    # Ensure reproducibility for the same inputs (Fix for USER_REQUEST)
    # Using a fixed seed for all simulations in this request
    sim_seed = 42
    
    rl_system = ClimateSystem(seed=sim_seed)
    
    # Get the ACTUAL initial state from the system (Fix for RL bug)
    initial_e = sum(s.emissions for s in rl_system.sectors.values())
    initial_p = sum(s.production for s in rl_system.sectors.values())
    initial_state = [initial_e, initial_p, 0.2, 0.8]
    
    # Track all metrics
    history = {
        "emissions": [], "gdp": [], "renewable_share": [], 
        "acceptance": [], "rewards": [], "temp_rise": [],
        "sectors": {"Energy": [], "Industry": [], "Transport": [], "Agriculture": []}
    }

    # Helper to run one step
    def run_step(tax, subsidy):
        result = rl_system.step(tax, subsidy, crisis_mode)
        state = result["state"]
        history["emissions"].append(float(state[0]))
        history["gdp"].append(float(state[1]))
        history["renewable_share"].append(float(state[2]))
        history["acceptance"].append(float(state[3]))
        history["rewards"].append(float(result["reward"]))
        history["temp_rise"].append(float(result["temp_rise"]))
        for name, data in result["sectors"].items():
            history["sectors"][name].append(float(data["emissions"]))
        return state

    # Load RL model if needed
    model = None
    if mode == "Trained RL Policy (Auto)":
        try:
            model = PPO.load("climate_policy_model")
        except:
            mode = "Manual Policy" # Fallback

    # Determine policy timeline
    if request.roadmap and mode == "Manual Policy":
        for stage in request.roadmap:
            for _ in range(stage.year_end - stage.year_start + 1):
                run_step(stage.carbon_tax, stage.renewable_subsidy)
    else:
        # Default 50 year simulation
        for i in range(50):
            if mode == "Trained RL Policy (Auto)" and model:
                # Use actual current metrics or initial state
                if i == 0:
                    state_arr = np.array(initial_state, dtype=np.float32)
                else:
                    state_arr = np.array([history["emissions"][-1], 
                                         history["gdp"][-1],
                                         history["renewable_share"][-1],
                                         history["acceptance"][-1]], dtype=np.float32)
                
                action, _ = model.predict(state_arr, deterministic=True)
                run_step(float(action[0]), float(action[1]))
            else:
                run_step(request.carbon_tax, request.renewable_subsidy)

    # -------- Static Comparisons --------
    # Use the same seed and crisis_mode for fair comparison
    mod_sys = ClimateSystem(seed=sim_seed)
    agg_sys = ClimateSystem(seed=sim_seed)
    no_sys = ClimateSystem(seed=sim_seed)

    mod_hist = {"emissions": [], "gdp": [], "renewable_share": [], "acceptance": [], "rewards": []}
    agg_hist = {"emissions": [], "gdp": [], "renewable_share": [], "acceptance": [], "rewards": []}
    no_hist = {"emissions": [], "gdp": [], "renewable_share": [], "acceptance": [], "rewards": []}

    for _ in range(50):
        r1 = mod_sys.step(5, 5, crisis_mode)
        r2 = agg_sys.step(25, 25, crisis_mode)
        r3 = no_sys.step(0, 0, crisis_mode)
        s1, s2, s3 = r1["state"], r2["state"], r3["state"]
        
        mod_hist["emissions"].append(float(s1[0]))
        mod_hist["gdp"].append(float(s1[1]))
        mod_hist["renewable_share"].append(float(s1[2]))
        mod_hist["acceptance"].append(float(s1[3]))
        mod_hist["rewards"].append(float(r1["reward"]))
        
        agg_hist["emissions"].append(float(s2[0]))
        agg_hist["gdp"].append(float(s2[1]))
        agg_hist["renewable_share"].append(float(s2[2]))
        agg_hist["acceptance"].append(float(s2[3]))
        agg_hist["rewards"].append(float(r2["reward"]))
        
        no_hist["emissions"].append(float(s3[0]))
        no_hist["gdp"].append(float(s3[1]))
        no_hist["renewable_share"].append(float(s3[2]))
        no_hist["acceptance"].append(float(s3[3]))
        no_hist["rewards"].append(float(r3["reward"]))

    # -------- Sensitivity Analysis --------
    tax_values = np.linspace(0, 50, 20)
    final_emissions = []
    for tax_val in tax_values:
        system = ClimateSystem(seed=sim_seed)
        step_result = None
        for _ in range(50):
            step_result = system.step(tax_val, 10)
        final_emissions.append(float(step_result["state"][0]))

    initial_emission = history["emissions"][0]
    final_emission = history["emissions"][-1]
    reduction_pct = ((initial_emission - final_emission) / initial_emission) * 100

    # LLM Analysis
    llm_input = {
        "mode": mode, "carbon_tax": request.carbon_tax, "renewable_subsidy": request.renewable_subsidy,
        "emission_reduction": reduction_pct, "final_emission": final_emission, "final_gdp": history["gdp"][-1],
        "renewable_share": history["renewable_share"][-1] * 100, "acceptance": history["acceptance"][-1],
        "final_reward": history["rewards"][-1],
        "moderate_emission": mod_hist["emissions"][-1],
        "aggressive_emission": agg_hist["emissions"][-1],
        "no_policy_emission": no_hist["emissions"][-1],
        "crisis_impact": "Active" if crisis_mode else "None"
    }
    
    groq_api_key = os.environ.get("GROQ_API_KEY", "")
    llm_analysis = generate_llm_insights(llm_input, groq_api_key) if groq_api_key else "AI insights unavailable"

    return {
        "time_series": {
            "rl": {
                "emissions": history["emissions"],
                "gdp": history["gdp"],
                "renewable_share": history["renewable_share"],
                "acceptance": history["acceptance"],
                "rewards": history["rewards"],
                "temp_rise": history["temp_rise"]
            },
            "sectors": history["sectors"],
            "moderate": mod_hist,
            "aggressive": agg_hist,
            "no_policy": no_hist
        },
        "sensitivity": {
            "tax_values": tax_values.tolist(),
            "final_emissions": final_emissions
        },
        "metrics": {
            "emission_reduction_pct": reduction_pct,
            "final_gdp": history["gdp"][-1],
            "final_renewable_share": history["renewable_share"][-1],
            "final_acceptance": history["acceptance"][-1],
            "initial_emission": initial_emission,
            "final_emission": final_emission
        },
        "recommendation": {"tax": request.carbon_tax, "subsidy": request.renewable_subsidy},
        "ai_insights": llm_analysis
    }


# Static frontend mount
build_dir = os.path.join(os.path.dirname(__file__), "frontend", "dist")
if os.path.isdir(build_dir):
    app.mount("/app", StaticFiles(directory=build_dir, html=True), name="frontend")