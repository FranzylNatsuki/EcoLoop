import re

def remove_unused(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Match and remove `const categories = [ ... ]`
    content = re.sub(r'const categories\s*=\s*\[.*?\]', '', content, flags=re.DOTALL)
    
    # Match and remove `function setCategory(value: string) { ... }`
    content = re.sub(r'function setCategory\(value: string\)\s*\{.*?\}', '', content, flags=re.DOTALL)

    with open(filepath, 'w') as f:
        f.write(content)

remove_unused('ecoloop-web/src/views/EventsView.vue')
remove_unused('ecoloop-web/src/views/MarketplaceView.vue')

