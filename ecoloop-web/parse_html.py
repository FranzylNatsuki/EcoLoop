import re, sys

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'<[^>]+>', ' ', text)
lines = [line.strip() for line in text.split('\n') if line.strip()]

for i, line in enumerate(lines):
    if 'approve' in line.lower() or 'permission' in line.lower() or 'auto' in line.lower():
        print(f"--- Line {i} ---")
        print("\n".join(lines[max(0, i-2):min(len(lines), i+3)]))
