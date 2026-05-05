import pandas as pd
import matplotlib.pyplot as plt

# Load cleaned dataset
df = pd.read_csv("data/india_climate_clean.csv")

# Plot CO2 per capita over time
plt.figure()
plt.plot(df["Year"], df["CO2_per_capita"])
plt.xlabel("Year")
plt.ylabel("CO2 per Capita")
plt.title("India CO2 per Capita Over Time")
plt.show()

# Plot GDP over time
plt.figure()
plt.plot(df["Year"], df["GDP"])
plt.xlabel("Year")
plt.ylabel("GDP")
plt.title("India GDP Over Time")
plt.show()

# Print correlation
correlation = df["CO2_per_capita"].corr(df["GDP"])
print("Correlation between CO2 per capita and GDP:", correlation)