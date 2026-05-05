import pandas as pd

# Load OWID dataset
df = pd.read_csv("data/owid-co2-data.csv")

# Filter India
india = df[df["country"] == "India"]

# Keep only required columns
india = india[["year", "co2", "co2_per_capita", "gdp", "population"]]

# Drop missing values
india = india.dropna()

# Rename columns
india = india.rename(columns={
    "year": "Year",
    "co2": "Total_CO2",
    "co2_per_capita": "CO2_per_capita",
    "gdp": "GDP",
    "population": "Population"
})

# Sort
india = india.sort_values("Year")

# Save clean dataset
india.to_csv("data/india_climate_clean.csv", index=False)

print("Clean India climate dataset saved successfully!")