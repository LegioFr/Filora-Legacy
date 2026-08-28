import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHECKER = ROOT / 'tools' / 'check_architecture.py'


class ArchitectureGuardTests(unittest.TestCase):
    def run_checker(self, files: dict[str, str]) -> subprocess.CompletedProcess[str]:
        with tempfile.TemporaryDirectory() as directory:
            src = Path(directory) / 'src'
            for relative, content in files.items():
                path = src / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(content, encoding='utf-8')
            return subprocess.run(
                [sys.executable, str(CHECKER), str(src)],
                text=True,
                capture_output=True,
                check=False,
            )

    def test_app_may_depend_on_domain(self) -> None:
        result = self.run_checker({
            'app/App.tsx': "import '../domains/spools/view'\n",
            'domains/spools/view.ts': 'export const view = true\n',
        })
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_domain_must_not_depend_on_app(self) -> None:
        result = self.run_checker({
            'domains/spools/model.ts': "import '../../app/App'\n",
            'app/App.tsx': 'export const App = true\n',
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn('domains must not depend on app', result.stderr)

    def test_domain_dynamic_import_must_not_depend_on_app(self) -> None:
        result = self.run_checker({
            'domains/spools/model.ts': "export const loadApp = () => import('../../app/App')\n",
            'app/App.tsx': 'export const App = true\n',
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn('domains must not depend on app', result.stderr)

    def test_shared_must_not_depend_on_domain(self) -> None:
        result = self.run_checker({
            'shared/value.ts': "export { value } from '../domains/spools/value'\n",
            'domains/spools/value.ts': 'export const value = true\n',
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn('shared must not depend on domains', result.stderr)

    def test_shared_dynamic_import_must_not_depend_on_app(self) -> None:
        result = self.run_checker({
            'shared/value.ts': "export const loadApp = () => import('../app/App')\n",
            'app/App.tsx': 'export const App = true\n',
        })
        self.assertEqual(result.returncode, 1)
        self.assertIn('shared must not depend on app', result.stderr)


if __name__ == '__main__':
    unittest.main()
