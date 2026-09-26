import re

with open('ecoloop-web/src/composables/useEvents.ts', 'r') as f:
    text = f.read()

# Replace the conflict in useEvents.ts
pattern = r"<<<<<<< HEAD\n\s*const donatedItems = calculatedTotalDonated > 0 \? calculatedTotalDonated : 0\n=======\n(?:.*?)\n\s*const donatedItems = calculatedTotalDonated > 0 \? calculatedTotalDonated : Number\(totalRow\?.donated_items \|\| 0\)\n>>>>>>> origin/ManoloNew"

text = re.sub(
    pattern,
    "      const donatedItems = calculatedTotalDonated > 0 ? calculatedTotalDonated : 0",
    text,
    flags=re.DOTALL
)

with open('ecoloop-web/src/composables/useEvents.ts', 'w') as f:
    f.write(text)

