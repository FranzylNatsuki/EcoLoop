import re

def wipe(filepath, regex):
    with open(filepath, 'r') as f:
        content = f.read()
    content = re.sub(regex, '', content, flags=re.DOTALL)
    with open(filepath, 'w') as f:
        f.write(content)

events_regex = r'\.events-categories\s*\{.*?\.category-pill--active\s*\{.*?\}'
market_regex = r'\.marketplace-categories\s*\{.*?\.category-pill--active\s*\{.*?\}'
wipe('ecoloop-web/src/views/EventsView.vue', events_regex)
wipe('ecoloop-web/src/views/MarketplaceView.vue', market_regex)
