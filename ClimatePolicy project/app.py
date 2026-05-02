import streamlit as st
import matplotlib.pyplot as plt
import numpy as np
from stable_baselines3 import PPO
from multi_agent_system import ClimateSystem
from climate_env import ClimateEnv
from llm import generate_llm_insights

st.set_page_config(page_title="Agentic AI Climate Policy", page_icon="🌿", layout="wide")

st.title("🌍 Agentic AI framework for climate policy optimization and impact assesment")
st.write("Optimize carbon tax and renewable subsidy using Multi-Agent Reinforcement Learning.")

# ===============================
# SIDEBAR CONTROLS
# ===============================
st.sidebar.header("Policy Controls")

carbon_tax = st.sidebar.slider("Carbon Tax Level", 0.0, 50.0, 10.0)
renewable_subsidy = st.sidebar.slider("Renewable Subsidy Level", 0.0, 50.0, 10.0)

mode = st.sidebar.radio(
    "Policy Mode",
    ["Manual Policy", "Trained RL Policy (Auto)"]
)

run_button = st.sidebar.button("Run Simulation")

# ===============================
# MAIN SIMULATION
# ===============================
if run_button:

    # Load trained model if Auto mode
    if mode == "Trained RL Policy (Auto)":
        model = PPO.load("climate_policy_model")
        env = ClimateEnv()
        state, _ = env.reset()

    rl_system = ClimateSystem(seed=42)
    rl_emissions = []
    rl_gdp = []
    rl_renewable_share = []
    rl_acceptance = []
    rl_rewards = []

    # -------- Simulation Loop --------
    for _ in range(50):

        if mode == "Trained RL Policy (Auto)":
            action, _ = model.predict(state, deterministic=True)
            tax = float(action[0])
            subsidy = float(action[1])

            state, reward, done, truncated, _ = env.step(action)

        else:
            tax = carbon_tax
            subsidy = renewable_subsidy
            state, reward = rl_system.step(tax, subsidy)

        rl_emissions.append(state[0])
        rl_gdp.append(state[1])
        rl_renewable_share.append(state[2])
        rl_acceptance.append(state[3])
        rl_rewards.append(reward)

    # -------- Static Policies --------
    moderate_system = ClimateSystem(seed=42)
    aggressive_system = ClimateSystem(seed=42)
    no_policy_system = ClimateSystem(seed=42)

    moderate_emissions, moderate_gdp, moderate_rena, moderate_acc, moderate_rewards = [], [], [], [], []
    aggressive_emissions, aggressive_gdp, aggressive_rena, aggressive_acc, aggressive_rewards = [], [], [], [], []
    no_emissions, no_gdp, no_rena, no_acc, no_rewards = [], [], [], [], []

    for _ in range(50):
        s1, r1 = moderate_system.step(5, 5)
        s2, r2 = aggressive_system.step(25, 25)
        s3, r3 = no_policy_system.step(0, 0)

        moderate_emissions.append(s1[0])
        moderate_gdp.append(s1[1])
        moderate_rena.append(s1[2])
        moderate_acc.append(s1[3])
        moderate_rewards.append(r1)

        aggressive_emissions.append(s2[0])
        aggressive_gdp.append(s2[1])
        aggressive_rena.append(s2[2])
        aggressive_acc.append(s2[3])
        aggressive_rewards.append(r2)

        no_emissions.append(s3[0])
        no_gdp.append(s3[1])
        no_rena.append(s3[2])
        no_acc.append(s3[3])
        no_rewards.append(r3)

    st.success("Simulation Complete")

    col1, col2 = st.columns(2)

    # ===============================
    # EMISSION GRAPH
    # ===============================
    with col1:
        fig1, ax1 = plt.subplots()
        ax1.plot(rl_emissions, label="RL Policy" if mode=="Trained RL Policy (Auto)" else "Manual Policy", color="#2e8b57", linewidth=2.5)
        ax1.plot(moderate_emissions, label="Moderate Static (5,5)", color="#4ca64c", linestyle="--")
        ax1.plot(aggressive_emissions, label="Aggressive Static (25,25)", color="#006400", linestyle="-.")
        ax1.plot(no_emissions, label="No Policy (0,0)", color="#b22222", linestyle=":")
        ax1.set_title("Emissions Comparison")
        ax1.set_xlabel("Time Steps")
        ax1.set_ylabel("Emissions")
        ax1.legend()
        ax1.grid(True)
        st.pyplot(fig1)

    # ===============================
    # REWARD GRAPH
    # ===============================
    with col2:
        fig2, ax2 = plt.subplots()
        ax2.plot(rl_rewards, label="RL Policy" if mode=="Trained RL Policy (Auto)" else "Manual Policy", color="#2e8b57", linewidth=2.5)
        ax2.plot(moderate_rewards, label="Moderate Static (5,5)", color="#4ca64c", linestyle="--")
        ax2.plot(aggressive_rewards, label="Aggressive Static (25,25)", color="#006400", linestyle="-.")
        ax2.plot(no_rewards, label="No Policy (0,0)", color="#b22222", linestyle=":")
        ax2.set_title("Reward Comparison")
        ax2.set_xlabel("Time Steps")
        ax2.set_ylabel("Reward")
        ax2.legend()
        ax2.grid(True)
        st.pyplot(fig2)

    # ===============================
    # ADDITIONAL GRAPHS
    # ===============================
    col3, col4 = st.columns(2)
    
    with col3:
        fig_gdp, ax_gdp = plt.subplots()
        ax_gdp.plot(rl_gdp, label="RL Policy" if mode=="Trained RL Policy (Auto)" else "Manual Policy", color="#2e8b57", linewidth=2.5)
        ax_gdp.plot(moderate_gdp, label="Moderate Static", color="#4ca64c", linestyle="--")
        ax_gdp.plot(aggressive_gdp, label="Aggressive Static", color="#006400", linestyle="-.")
        ax_gdp.plot(no_gdp, label="No Policy", color="#b22222", linestyle=":")
        ax_gdp.set_title("GDP Comparison")
        ax_gdp.set_xlabel("Time Steps")
        ax_gdp.set_ylabel("GDP")
        ax_gdp.legend()
        ax_gdp.grid(True)
        st.pyplot(fig_gdp)

    with col4:
        fig_ren, ax_ren = plt.subplots()
        ax_ren.plot(rl_renewable_share, label="RL Policy" if mode=="Trained RL Policy (Auto)" else "Manual Policy", color="#2e8b57", linewidth=2.5)
        ax_ren.plot(moderate_rena, label="Moderate Static", color="#4ca64c", linestyle="--")
        ax_ren.plot(aggressive_rena, label="Aggressive Static", color="#006400", linestyle="-.")
        ax_ren.plot(no_rena, label="No Policy", color="#b22222", linestyle=":")
        ax_ren.set_title("Renewable Energy Share")
        ax_ren.set_xlabel("Time Steps")
        ax_ren.set_ylabel("Share (0-1)")
        ax_ren.legend()
        ax_ren.grid(True)
        st.pyplot(fig_ren)
        
    col5, col6 = st.columns(2)
    with col5:
        fig_acc, ax_acc = plt.subplots()
        ax_acc.plot(rl_acceptance, label="RL Policy" if mode=="Trained RL Policy (Auto)" else "Manual Policy", color="#2e8b57", linewidth=2.5)
        ax_acc.plot(moderate_acc, label="Moderate Static", color="#4ca64c", linestyle="--")
        ax_acc.plot(aggressive_acc, label="Aggressive Static", color="#006400", linestyle="-.")
        ax_acc.plot(no_acc, label="No Policy", color="#b22222", linestyle=":")
        ax_acc.set_title("Public Acceptance")
        ax_acc.set_xlabel("Time Steps")
        ax_acc.set_ylabel("Acceptance (0-1)")
        ax_acc.legend()
        ax_acc.grid(True)
        st.pyplot(fig_acc)

    # ===============================
    # METRICS
    # ===============================
    initial_emission = rl_emissions[0]
    final_emission = rl_emissions[-1]
    emission_reduction_pct = ((initial_emission - final_emission) / initial_emission) * 100

    st.subheader("📊 Policy Evaluation Metrics")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Emission Reduction", f"{emission_reduction_pct:.1f}%")
    m2.metric("Final GDP", f"${rl_gdp[-1]:.0f}")
    m3.metric("Final Renewable %", f"{rl_renewable_share[-1]*100:.1f}%")
    m4.metric("Final Acceptance", f"{rl_acceptance[-1]:.2f}")

    # ===============================
    # POLICY RECOMMENDATION
    # ===============================
    st.subheader("🤖 AI Policy Recommendation")

    st.write(f"""
    **Recommended Carbon Tax**: {tax:.2f}  
    **Recommended Renewable Subsidy**: {subsidy:.2f}  
    **Expected Outcomes**: Final Emission {final_emission:.2f} | Final GDP ${rl_gdp[-1]:.0f} | Renewable Share {rl_renewable_share[-1]*100:.1f}% | Acceptance {rl_acceptance[-1]:.2f}
    """)

    # ===============================
    # LLM-POWERED POLICY INSIGHTS
    # ===============================
    st.subheader("🧠 LLM-Generated Policy Insights (LLaMA-3 via Groq)")

    try:
        api_key = st.secrets["GROQ_API_KEY"]

        llm_data = {
            'mode': mode,
            'carbon_tax': tax,
            'renewable_subsidy': subsidy,
            'emission_reduction': emission_reduction_pct,
            'final_emission': final_emission,
            'final_gdp': rl_gdp[-1],
            'renewable_share': rl_renewable_share[-1] * 100,
            'acceptance': rl_acceptance[-1],
            'final_reward': rl_rewards[-1],
            'moderate_emission': moderate_emissions[-1],
            'aggressive_emission': aggressive_emissions[-1],
            'no_policy_emission': no_emissions[-1],
        }

        with st.spinner("🔄 Generating AI policy insights using LLaMA-3..."):
            llm_response = generate_llm_insights(llm_data, api_key)

        st.markdown(llm_response)

    except KeyError:
        st.warning("⚠️ Groq API Key not found. Please add your key to `.streamlit/secrets.toml` as:\n\n`GROQ_API_KEY = \"your-key-here\"`")
        llm_response = "LLM insights unavailable (no API key)."
    except Exception as e:
        st.error(f"❌ LLM Error: {e}")
        llm_response = f"LLM insights unavailable: {e}"

    # ===============================
    # SENSITIVITY ANALYSIS
    # ===============================
    st.subheader("🔬 Sensitivity Analysis: Tax vs Final Emission")

    tax_values = np.linspace(0, 50, 20)
    final_emissions = []

    for tax_val in tax_values:
        system = ClimateSystem(seed=42)
        for _ in range(50):
            state_temp, _ = system.step(tax_val, 10)
        final_emissions.append(state_temp[0])

    fig3, ax3 = plt.subplots()
    ax3.plot(tax_values, final_emissions, color="#2e8b57", marker="o")
    ax3.set_title("Sensitivity Analysis")
    ax3.set_xlabel("Carbon Tax")
    ax3.set_ylabel("Final Emission")
    ax3.grid(True)
    st.pyplot(fig3)

    # ===============================
    # EXPERIMENT TABLE
    # ===============================
    st.subheader("🧪 Experimental Comparison")

    st.table({
        "Policy": [
            "RL / Manual Selected",
            "Moderate Static (5,5)",
            "Aggressive Static (25,25)",
            "No Policy (0,0)"
        ],
        "Final Emission": [
            rl_emissions[-1],
            moderate_emissions[-1],
            aggressive_emissions[-1],
            no_emissions[-1]
        ],
        "Final GDP": [
            rl_gdp[-1],
            moderate_gdp[-1],
            aggressive_gdp[-1],
            no_gdp[-1]
        ],
        "Ren. Share (%)": [
            rl_renewable_share[-1]*100,
            moderate_rena[-1]*100,
            aggressive_rena[-1]*100,
            no_rena[-1]*100
        ],
        "Acceptance": [
            rl_acceptance[-1],
            moderate_acc[-1],
            aggressive_acc[-1],
            no_acc[-1]
        ],
        "Final Reward": [
            rl_rewards[-1],
            moderate_rewards[-1],
            aggressive_rewards[-1],
            no_rewards[-1]
        ]
    })

    # ===============================
    # DOWNLOAD REPORT
    # ===============================
    report_text = f"""
AI Climate Policy Optimization Report
======================================

Mode: {mode}
Carbon Tax: {tax}
Renewable Subsidy: {subsidy}

Initial Emission: {initial_emission}
Final Emission: {final_emission}
Emission Reduction (%): {emission_reduction_pct:.2f}
Final GDP: {rl_gdp[-1]:.2f}
Final Renewable Share: {rl_renewable_share[-1]:.2f}
Final Public Acceptance: {rl_acceptance[-1]:.2f}
Final Reward: {rl_rewards[-1]}

Comparison:
- Moderate Static (5,5): Final Emission = {moderate_emissions[-1]:.4f}
- Aggressive Static (25,25): Final Emission = {aggressive_emissions[-1]:.4f}
- No Policy (0,0): Final Emission = {no_emissions[-1]:.4f}

--------------------------------------
LLM-Generated Policy Insights (LLaMA-3)
--------------------------------------
{llm_response}
"""

    st.download_button(
        label="📄 Download Simulation Report",
        data=report_text,
        file_name="climate_policy_report.txt",
        mime="text/plain"
    )