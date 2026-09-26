import re

def process_file(filepath, ugly_bar_pattern, categories_arr_pattern, set_cat_str):
    with open(filepath, 'r') as f:
        content = f.read()

    # Remove the ugly nav bar
    content = re.sub(ugly_bar_pattern, '', content, flags=re.DOTALL)
    
    # Replace CategoryBar invocation
    if 'EventsView.vue' in filepath:
        content = content.replace('<CategoryBar />', '<CategoryBar type="events" />')
        content = content.replace('<CategoryBar/>', '<CategoryBar type="events" />')
    elif 'MarketplaceView.vue' in filepath or 'MarketOnlyView.vue' in filepath:
        content = content.replace('<CategoryBar />', '<CategoryBar type="marketplace" />')
        content = content.replace('<CategoryBar/>', '<CategoryBar type="marketplace" />')

    # Remove TS Variables
    if categories_arr_pattern:
        content = re.sub(categories_arr_pattern, '', content, flags=re.DOTALL)
    if set_cat_str:
        content = content.replace(set_cat_str, '')

    with open(filepath, 'w') as f:
        f.write(content)

events_nav_pattern = r'<nav class="events-categories">.*?</nav>'
events_ts_pattern = r'const categories = \[\s*\{ label: \'All\',.*?\]\n'
events_setcat = """function setCategory(value: string) {
  router.push({ path: '/events', query: value ? { category: value } : {} })
}"""

process_file('ecoloop-web/src/views/EventsView.vue', events_nav_pattern, events_ts_pattern, events_setcat)

market_nav_pattern = r'<nav class="marketplace-categories">.*?</nav>'
market_ts_pattern = r'const categories = \[\s*\{ label: \'All\',.*?\]\n'
market_setcat = """function setCategory(value: string) {
  router.push({ path: '/marketplace', query: value ? { category: value } : {} })
}"""

process_file('ecoloop-web/src/views/MarketplaceView.vue', market_nav_pattern, market_ts_pattern, market_setcat)
process_file('ecoloop-web/src/views/MarketOnlyView.vue', market_nav_pattern, None, None)

