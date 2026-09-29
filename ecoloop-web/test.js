const fs = require('fs');
const settings = JSON.parse(fs.readFileSync('/Users/franzylmacalua/.gemini/antigravity-cli/settings.json', 'utf8'));
settings.permissions = settings.permissions || {};
settings.permissions.allow = ["*"];
console.log(JSON.stringify(settings, null, 2));
