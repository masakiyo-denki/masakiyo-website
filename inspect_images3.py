import requests, re

url = 'https://www.masakiyo-denki.com/post/%E6%96%B0%E3%83%BB%E3%83%91%E3%83%8A%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B9%E3%82%BF%E3%83%BC%E3%83%88%E3%81%AE%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B'
r = requests.get(url, timeout=20, headers={'User-Agent': 'Mozilla/5.0'})
html = r.text

# 5bad88b7周辺のHTML（前後500文字）を確認
pos = html.find('5bad88b7bbf14782b5d9b11995524075')
if pos >= 0:
    print('=== 5bad88b7 周辺HTML ===')
    print(html[max(0,pos-300):pos+300])

# relatedPostの周辺確認
for kw in ['related', 'Related', 'recentPost', 'relatedPost', 'PostList']:
    pos2 = html.find(kw)
    if pos2 > 0:
        print(f'\n=== キーワード "{kw}" の位置: {pos2} ===')
        print(html[max(0,pos2-100):pos2+200])
        break
