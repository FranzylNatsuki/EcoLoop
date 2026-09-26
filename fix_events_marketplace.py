import re

# 1. Update EventsView.vue
with open('ecoloop-web/src/views/EventsView.vue', 'r') as f:
    events_text = f.read()

# Replace `<CategoryBar />` with `<CategoryBar type="events" />`
events_text = re.sub(r'<CategoryBar\s*/>', '<CategoryBar type="events" />', events_text)

# Remove the ugly bar
ugly_bar_pattern = r'<nav class="events-categories">.*?</nav>'
events_text = re.sub(ugly_bar_pattern, '', events_text, flags=re.DOTALL)

with open('ecoloop-web/src/views/EventsView.vue', 'w') as f:
    f.write(events_text)

# 2. Update MarketplaceView.vue
with open('ecoloop-web/src/views/MarketplaceView.vue', 'r') as f:
    market_text = f.read()

market_text = re.sub(r'<CategoryBar\s*/>', '<CategoryBar type="marketplace" />', market_text)
market_text = re.sub(r'<nav class="marketplace-categories">.*?</nav>', '', market_text, flags=re.DOTALL)

with open('ecoloop-web/src/views/MarketplaceView.vue', 'w') as f:
    f.write(market_text)
