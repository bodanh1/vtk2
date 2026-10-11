import json
from pathlib import Path
from PIL import Image

report_path = Path('docs/client-buffs-bosses.json')
report = json.loads(report_path.read_text(encoding='utf8'))
data_path = Path('js/client-activity-data.js')
source = data_path.read_text(encoding='utf8')
mapping = {}
for entry in report['audit']:
    old = Path(entry.get('file', entry['f']))
    new = old.with_suffix('.webp')
    with Image.open(old) as image:
        image.save(new, 'WEBP', lossless=True, method=6, exact=True)
        with Image.open(new) as encoded:
            assert image.convert('RGBA').tobytes() == encoded.convert('RGBA').tobytes()
    mapping[str(old).replace('\\', '/')] = str(new).replace('\\', '/')
    entry['f'] = str(new).replace('\\', '/') if entry['kind'] == 'buff' else new.name
    if 'file' in entry:
        entry['file'] = str(new).replace('\\', '/')
    entry['bytes'] = new.stat().st_size
for old, new in mapping.items():
    source = source.replace(old, new).replace(Path(old).name, Path(new).name)
data_path.write_text(source, encoding='utf8')
report['totalBytes'] = sum(e['bytes'] for e in report['audit'])
report['encoding'] = 'WebP lossless; all RGBA pixels verified'
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
for old in mapping:
    Path(old).unlink()
print('Total bytes:', report['totalBytes'])
