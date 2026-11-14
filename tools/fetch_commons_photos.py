#!/usr/bin/env python3
"""tools/commons_photos.json 에 적힌 위키미디어 공용 이미지를 내려받아
workout/img/commons/ 에 저장하고, 출처·라이선스를 담은 workout/photos-commons.js 를 만든다.
GitHub Actions(.github/workflows/fetch-photos.yml)에서 실행한다."""
import hashlib, json, os, re, sys, time, urllib.parse, urllib.request
from io import BytesIO
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'workout', 'img', 'commons')
UA = {'User-Agent': 'JagigwanriFitnessApp/1.0 (https://github.com/DexWon/winkfeel; photo credits shown in app)'}

def get(url):
    for i in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read()
        except Exception as e:  # 429 등은 잠시 기다렸다 재시도
            err = e; time.sleep(10 * (i + 1))
    raise err

def strip(html):
    return re.sub(r'\s+', ' ', re.sub('<[^>]+>', '', html or '')).strip()

def main():
    spec = json.load(open(os.path.join(ROOT, 'tools', 'commons_photos.json'), encoding='utf-8'))['photos']
    os.makedirs(OUT, exist_ok=True)
    cache, result, failed = {}, {}, []
    for p in spec:
        t = p['title']
        if t not in cache:
            q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': 'File:' + t, 'prop': 'imageinfo',
                                        'iiprop': 'url|extmetadata|size', 'iiurlwidth': 960})
            try:
                page = list(json.loads(get('https://commons.wikimedia.org/w/api.php?' + q))['query']['pages'].values())[0]
                ii = page['imageinfo'][0]; m = ii['extmetadata']
                lic = m.get('LicenseShortName', {}).get('value', '')
                if not re.search(r'CC0|CC BY|Public domain', lic, re.I):
                    raise ValueError('not a free license: ' + lic)
                url = ii['thumburl'] if ii.get('width', 0) > 960 and ii.get('thumburl') else ii['url']
                im = Image.open(BytesIO(get(url))); im.load()
                if im.mode in ('RGBA', 'LA', 'P'):
                    bg = Image.new('RGB', im.size, 'white'); im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
                im = im.convert('RGB'); im.thumbnail((900, 900))
                fn = re.sub(r'[^A-Za-z0-9]+', '-', os.path.splitext(t)[0]).strip('-').lower()[:60] or 'img'
                fn = (f'{fn}-' + hashlib.md5(t.encode()).hexdigest()[:8] if fn == 'img' else fn) + '.jpg'
                im.save(os.path.join(OUT, fn), quality=80, optimize=True, progressive=True)
                artist = strip(m.get('Artist', {}).get('value')) or '작성자 미상'
                cache[t] = {'src': f'img/commons/{fn}', 'credit': f'{artist} · {lic} · Wikimedia Commons',
                            'page': ii['descriptionurl'], 'license_url': m.get('LicenseUrl', {}).get('value', '')}
                print('OK', t, '->', fn, '|', lic)
            except Exception as e:
                print('FAIL', t, e); failed.append(t); cache[t] = None
            time.sleep(2)
        if cache[t]:
            result.setdefault(p['lib'], []).append({**cache[t], 'caption': p.get('caption', '')})
    with open(os.path.join(ROOT, 'workout', 'photos-commons.js'), 'w', encoding='utf-8') as f:
        f.write('/* 자동 생성: tools/fetch_commons_photos.py — 직접 고치지 마세요 */\n')
        f.write('const PHOTOS_COMMONS = ' + json.dumps(result, ensure_ascii=False, indent=1) + ';\n')
    print(f'done: {sum(len(v) for v in result.values())} entries, {len(failed)} failed')
    if len(failed) == len({p["title"] for p in spec}):
        sys.exit(1)

if __name__ == '__main__':
    main()
