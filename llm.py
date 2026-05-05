from groq import Groq


def generate_llm_insights(data, api_key):
    """
    Uses Groq API with LLaMA-3 to generate policy insights
    from the climate simulation results.
    """
    client = Groq(api_key=api_key)

    prompt = f"""You are an expert climate policy analyst. Analyze the following climate policy simulation results and provide actionable insights.

## Simulation Results

**Policy Used:** {data['mode']}
**Carbon Tax Applied:** {data['carbon_tax']:.2f}
**Renewable Subsidy Applied:** {data['renewable_subsidy']:.2f}

### Key Metrics:
- Emission Reduction: {data['emission_reduction']:.1f}%
- Final Emissions: {data['final_emission']:.4f}
- Final GDP: ${data['final_gdp']:,.0f}
- Renewable Energy Share: {data['renewable_share']:.1f}%
- Public Acceptance: {data['acceptance']:.2f}
- Final Reward Score: {data['final_reward']:.2f}

### Comparison with Static Policies:
- Moderate Policy (Tax=5, Subsidy=5): Final Emission = {data['moderate_emission']:.4f}
- Aggressive Policy (Tax=25, Subsidy=25): Final Emission = {data['aggressive_emission']:.4f}
- No Policy (Tax=0, Subsidy=0): Final Emission = {data['no_policy_emission']:.4f}

## Instructions:
1. Summarize how well the selected policy performed.
2. Explain the trade-offs between emission reduction, economic growth (GDP), and public acceptance in simple language.
3. Compare the selected policy against the static baseline policies.
4. Provide 2-3 specific, actionable policy recommendations for decision makers.
5. Keep the response concise (under 300 words) and use bullet points where appropriate.
"""

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": "You are a climate policy expert providing data-driven insights to government decision makers. Be concise, clear, and actionable."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        model="llama-3.1-8b-instant",
        temperature=0.0,
        max_tokens=500,
    )

    return chat_completion.choices[0].message.content

