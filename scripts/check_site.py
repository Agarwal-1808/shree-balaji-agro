"""Run from the repository root: python3 scripts/check_site.py"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote, parse_qs
import hashlib
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PAGES = ['index.html', 'about.html', 'products.html', 'contact.html']

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.options = set(), [], []
        self.title = self.description = self.h1 = self.current = 0
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f"Duplicate id {a['id']}"
            self.ids.add(a['id'])
        if tag == 'title': self.title += 1
        if tag == 'h1': self.h1 += 1
        if tag == 'meta' and a.get('name') == 'description':
            assert a.get('content')
            self.description += 1
        if tag == 'a' and 'aria-current' in a: self.current += 1
        if tag == 'img': assert 'alt' in a, 'Missing image alt attribute'
        for key in ['src', 'href']:
            if a.get(key): self.refs.append(a[key])
        if a.get('srcset'):
            self.refs.extend(item.strip().split()[0] for item in a['srcset'].split(','))

pages = {name: Page((ROOT / name).read_text()) for name in PAGES}
count = 0
for name, page in pages.items():
    assert page.title == page.description == page.h1 == page.current == 1, name
    text = (ROOT / name).read_text()
    assert '9031746938' not in text, 'Old phone number'
    assert '350,000' not in text and 'Bühler' not in text, 'Unconfirmed claim'
    for ref in page.refs:
        parsed = urlsplit(ref)
        if parsed.scheme or parsed.netloc: continue
        path = unquote(parsed.path) or name
        assert (ROOT / path).is_file(), f'{name}: missing {path}'
        if parsed.fragment and path in pages:
            assert unquote(parsed.fragment) in pages[path].ids, f'{name}: missing anchor {ref}'
        if path == 'contact.html' and 'product=' in parsed.query:
            product = parse_qs(parsed.query)['product'][0]
            assert f'<option>{product}</option>' in (ROOT / path).read_text(), product
        count += 1
catalogue = (ROOT / 'products.html').read_text()
assert catalogue.count('class="product-card"') == 8
assert catalogue.count('class="pack-placeholder"') == 4
assert 'https://maps.app.goo.gl/C4Exgk9TKozG9GiR8?g_st=ic' in (ROOT/'contact.html').read_text()
# Compare every original asset against the untouched initial commit, including placeholder.
base = '9d16f2bfd286a5254a6a6c55d0b41ccb9c4e28a6'
for path in (ROOT/'images').iterdir():
    original = subprocess.check_output(['git', '-C', str(ROOT), 'show', f'{base}:images/{path.name}'])
    assert hashlib.sha256(original).digest() == hashlib.sha256(path.read_bytes()).digest(), path.name
print(f'PASS: 4 pages; {count} local references; all anchors; 8 products; 4 placeholders; original media unchanged.')
