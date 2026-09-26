import re

with open('ecoloop-web/src/components/layout/CategoryBar.vue', 'r') as f:
    content = f.read()

# Replace the default return for posts
old_post_return = """  // Default (Posts / Home Feed)
  return [
    'All',
    'Gardening',
    'Composting',
    'Upcycling',
    'Crafts & DIY',
    'Zero Waste',
    'E-Waste'
  ]"""

new_post_return = """  // Default (Posts / Home Feed)
  return [
    'All',
    'Gardening',
    'Composting',
    'Upcycling',
    'Crafts & DIY',
    'Zero Waste',
    'E-Waste',
    'Clean-Up Drive',
    'Recycling Workshop',
    'Upcycling Event',
    'Tree Planting'
  ]"""

content = content.replace(old_post_return, new_post_return)

with open('ecoloop-web/src/components/layout/CategoryBar.vue', 'w') as f:
    f.write(content)

