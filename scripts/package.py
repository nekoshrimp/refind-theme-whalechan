"""Create installation and repository archives using Python's standard library."""
from pathlib import Path
import argparse
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parent.parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--theme', type=Path, default=ROOT / 'whalechan', help='Theme to package, e.g. build/whalechan')
args = parser.parse_args()
theme = args.theme.resolve()
if not (theme / 'theme.conf').is_file():
    parser.error('Theme directory must contain theme.conf')
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
exclude = {'.git', 'node_modules', 'build', 'dist', '__pycache__'}
repo_files = [(p, 'refind-theme-whalechan/' + p.relative_to(ROOT).as_posix())
              for p in ROOT.rglob('*') if p.is_file()
              and not any(part in exclude for part in p.relative_to(ROOT).parts)
              and p.suffix != '.zip']
runtime_files = [theme / name for name in ('theme.conf', 'background.png', 'selection_big.png', 'selection_small.png')]
runtime_files.extend(sorted((theme / 'icons').glob('*.png')))
theme_files = [(p, 'whalechan/' + p.relative_to(theme).as_posix()) for p in runtime_files]
# Attribution accompanies the archive outside the installable theme directory.
theme_files.append((ROOT / 'LICENSE.md', 'LICENSE.md'))
theme_files.extend((p, 'licenses/' + p.name) for p in (ROOT / 'licenses').iterdir() if p.is_file())
reports = []
for name, files in [('refind-theme-whalechan-GitHub.zip', repo_files), ('Whale-chan-rEFInd-theme.zip', theme_files)]:
    target = dist / name
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for file, arcname in sorted(files):
            archive.write(file, arcname)
    with zipfile.ZipFile(target) as archive:
        assert archive.testzip() is None
        assert len(archive.namelist()) == len(files)
        for file, arcname in files:
            assert archive.read(arcname) == file.read_bytes()
    reports.append({'file': name, 'entries': len(files), 'sha256': hashlib.sha256(target.read_bytes()).hexdigest()})
(dist / 'checksums.json').write_text(json.dumps(reports, indent=2) + '\n', encoding='utf-8')
print(json.dumps(reports, indent=2))
