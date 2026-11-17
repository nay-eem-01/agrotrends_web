#!/usr/bin/env python3
"""Exercise deployment failures in a temporary VM stand-in, with no network or real Docker."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('deploy.sh')

class DeploymentTests(unittest.TestCase):
    def setup_base(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.bin = self.root / 'bin'
        self.bin.mkdir()
        self.home = self.root / 'home'
        self.home.mkdir()
        self.log = self.root / 'calls'
        self.env = dict(os.environ, PATH=f'{self.bin}:{os.environ["PATH"]}',
                        HOME=str(self.home), AGROTRENDS_HOME=str(self.home / 'agrotrends'),
                        AGROTRENDS_WEB_ROOT=str(self.root / 'web'), CALL_LOG=str(self.log))
        self.stub('sleep', 'exit 0')
        self.stub('sudo', 'shift; exec "$@"')

    def stub(self, name, body):
        path = self.bin / name
        path.write_text('#!/bin/bash\n' + body + '\n')
        path.chmod(0o755)

    def run_script(self, argument):
        return subprocess.run(['bash', str(self.script), argument], env=self.env,
                              capture_output=True, text=True)

    def test_rejects_invalid_release_before_mutation(self):
        result = self.run_script('../invalid')
        self.assertEqual(result.returncode, 2)
        self.assertFalse(self.log.exists())

    def setUp(self):
        self.setup_base()
        self.release = self.root / 'upload'
        (self.release / 'site').mkdir(parents=True)
        (self.release / 'site/index.html').write_text('<html>test</html>')
        self.script = self.release / 'deploy.sh'
        shutil.copyfile(SCRIPT, self.script)
        self.web = self.root / 'web'
        (self.web / 'old').mkdir(parents=True)
        (self.web / 'agrotrends-current').symlink_to(self.web / 'old')
        self.release_id = 'a' * 40 + '-123-1'
        self.stub('chown', 'exit 0')
        self.stub('curl', r'''if [[ ${HEALTH_FAIL:-0} == 1 ]]; then exit 22; fi
if [[ $* == *deployment-version.txt* ]]; then
    cat "$AGROTRENDS_WEB_ROOT/agrotrends-current/deployment-version.txt"
else echo '<html>test</html>'; fi''')

    def test_healthy_release_switches_symlink(self):
        result = self.run_script(self.release_id)
        self.assertEqual(result.returncode, 0, result.stderr)
        expected = self.web / 'agrotrends-releases' / self.release_id
        self.assertEqual((self.web / 'agrotrends-current').resolve(), expected)
        self.assertEqual((self.home / 'agrotrends/frontend-deploy/previous').resolve(), self.web / 'old')

    def test_failed_public_probe_restores_previous_release(self):
        self.env['HEALTH_FAIL'] = '1'
        result = self.run_script(self.release_id)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.web / 'agrotrends-current').resolve(), self.web / 'old')

    def test_missing_index_does_not_replace_active_release(self):
        (self.release / 'site/index.html').unlink()
        result = self.run_script(self.release_id)
        self.assertEqual(result.returncode, 2)
        self.assertEqual((self.web / 'agrotrends-current').resolve(), self.web / 'old')

if __name__ == '__main__':
    unittest.main()
