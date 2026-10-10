"""Encode native SPR atlases losslessly; verify every RGBA pixel before replacing PNGs."""
import json
from pathlib import Path
from PIL import Image

report_path = Path('docs/client-skill-effects.json')
report = json.loads(report_path.read_text(encoding='utf-8'))
converted = {}
for name in dict.fromkeys(entry['file'] for entry in report['entries']):
    source = Path(name)
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        rgba = image.convert('RGBA')
        rgba.save(target, 'WEBP', lossless=True, method=4, exact=True)
        with Image.open(target) as decoded:
            assert decoded.size == rgba.size
            assert decoded.convert('RGBA').tobytes() == rgba.tobytes(), name
    converted[name] = str(target).replace('\\', '/')
for entry in report['entries']:
    entry['file'] = converted[entry['file']]
    entry['bytes'] = Path(entry['file']).stat().st_size
report['totalBytes'] = sum(Path(name).stat().st_size for name in converted.values())
report['encoding'] = 'lossless WebP; RGBA round-trip verified'
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
fx_path = Path('fx.js')
text = fx_path.read_text(encoding='utf-8')
for original, target in converted.items():
    text = text.replace(original, target)
fx_path.write_text(text, encoding='utf-8')
for original in converted:
    Path(original).unlink()
print({'atlases': len(converted), 'MB': round(report['totalBytes'] / 1048576, 2)})
