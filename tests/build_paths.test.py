"""build_pack.py must never delete the pack source (output folder == or inside/around the source)."""
import os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BUILD = os.path.join(ROOT, 'overlay-generator', 'scripts', 'build_pack.py')
EXAMPLE = os.path.join(ROOT, 'overlay-generator', 'assets', 'example', 'flight-deck')
passed = failed = 0


def check(cond, msg):
    global passed, failed
    print(('PASS ' if cond else 'FAIL ') + msg)
    passed, failed = passed + bool(cond), failed + (not cond)


def run(cwd, *args):
    return subprocess.run([sys.executable, BUILD, *args, '--no-render'], cwd=cwd, capture_output=True, text=True)


with tempfile.TemporaryDirectory() as tmp:
    src = os.path.join(tmp, 'mika-flight-deck')               # folder named like the pack id
    shutil.copytree(EXAMPLE, src)
    r = run(tmp, 'mika-flight-deck')                          # default --out "." → dest == source
    check(r.returncode != 0 and 'overlaps' in r.stdout, 'default --out next to a source named like the id is refused')
    check(os.path.isfile(os.path.join(src, 'pack.json')), 'source still there after the refused build')

    r = run(tmp, 'mika-flight-deck', '--out', 'mika-flight-deck/build')   # dest inside the source
    check(r.returncode != 0 and os.path.isfile(os.path.join(src, 'pack.json')), 'output inside the source is refused')

    r = run(tmp, 'mika-flight-deck', '--out', os.path.join(tmp, 'build'))  # a normal build still works
    check(r.returncode == 0 and os.path.isfile(os.path.join(tmp, 'build', 'mika-flight-deck', 'panel.html')), 'build into a separate folder works')
    r = run(tmp, 'mika-flight-deck', '--out', os.path.join(tmp, 'build'))
    check(r.returncode == 0 and os.path.isfile(os.path.join(src, 'pack.json')), 'rebuilding over a previous output works and keeps the source')

print('\n%d passed, %d failed' % (passed, failed))
sys.exit(1 if failed else 0)
