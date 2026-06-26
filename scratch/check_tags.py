import re

with open("src/components/dashboard/QuizSessionPage.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find all opening and closing tags for common elements to see what is mismatched
# We need to strip out strings and comments first to avoid false positives
# Simple string and comment stripper:
def strip_comments_and_strings(code):
    # Strip multiline comments /* ... */
    code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    # Strip single line comments // ...
    code = re.sub(r'//.*', '', code)
    return code

clean_code = strip_comments_and_strings(content)

# We want to check tags in the JSX return block
# Let's track <div> tags
open_divs = 0
lines = clean_code.split('\n')
stack = []

for idx, line in enumerate(lines):
    line_num = idx + 1
    # Find all JSX tags in this line
    # Match <div... (not followed by />) and </div>
    # This is a basic parser but will help find anomalies
    matches = re.finditer(r'</?([a-zA-Z0-9]+)\b|/>', line)
    for m in matches:
        tag = m.group(0)
        if tag == '/>':
            if stack:
                stack.pop()
        elif tag.startswith('</'):
            tag_name = m.group(1)
            if stack and stack[-1] == tag_name:
                stack.pop()
            else:
                print(f"Mismatched closing tag {tag} at line {line_num}: {line.strip()}")
        elif tag.startswith('<'):
            # Check if self-closing inline (e.g. <div ... />)
            if not line[m.end():].strip().startswith('/>') and '/>' not in line[m.start():m.start()+100]: # rough check
                tag_name = m.group(1)
                # Ignore standard HTML self-closing tags like input, img, br, hr, link, meta
                if tag_name not in ['input', 'img', 'br', 'hr', 'link', 'meta']:
                    stack.append(tag_name)

print("Remaining stack:", stack)
