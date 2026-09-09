import os, re
import glob

routes_dir = r'e:\TheStyvex\styvex\src\routes'
files = glob.glob(os.path.join(routes_dir, '*.tsx'))

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        inner = match.group(1)
        # remove pt- variants without relying on \b at the end for bracketed classes
        inner = re.sub(r'\bpt-\[[^\]]+\]', '', inner)
        inner = re.sub(r'\bsm:pt-\[[^\]]+\]', '', inner)
        inner = re.sub(r'\bmd:pt-\[[^\]]+\]', '', inner)
        inner = re.sub(r'\bpt-\d+\b', '', inner)
        # cleanup double spaces
        inner = re.sub(r'\s+', ' ', inner).strip()
        return f'<main className="{inner}"'
        
    new_content = re.sub(r'<main\s+className=\"(.*?)\"', replacer, content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {os.path.basename(file)}')
