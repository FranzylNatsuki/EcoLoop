import re

files_to_fix = [
    'ecoloop-web/src/components/Modals/CreateEventModal.vue',
    'ecoloop-web/src/components/Modals/EditEventModal.vue'
]

replacement = """const categories = [
  'Volunteering',
  'Fundraiser',
  'Workshop',
  'Clean-up',
  'Gardening',
  'Crafts & DIY',
  'Upcycling',
  'Tree Planting'
]"""

# Update the event modals
for filename in files_to_fix:
    with open(filename, 'r') as f:
        text = f.read()
    
    # We'll use a regex to replace `const categories = [\n  ... \n]`
    # It might span multiple lines.
    pattern = r"const categories\s*=\s*\[(.*?)\]"
    
    text = re.sub(pattern, replacement, text, flags=re.DOTALL)
    
    with open(filename, 'w') as f:
        f.write(text)

