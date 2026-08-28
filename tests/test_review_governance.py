import tempfile
import unittest
from pathlib import Path

from tools.check_codex_security_prompt import check_prompt as check_codex_security_prompt
from tools.check_review_governance import check_development


class ReviewGovernanceTests(unittest.TestCase):
    def test_development_contains_permanent_contracts(self):
        self.assertEqual(check_development(Path("DEVELOPMENT.md")), [])

    def test_development_guard_rejects_removed_tool_rule(self):
        source = Path("DEVELOPMENT.md").read_text(encoding="utf-8")
        weakened = source.replace(
            "Une réponse tronquée, paginée ou limitée en taille ne constitue pas à elle seule une preuve que la donnée complète est inaccessible.",
            "Une réponse tronquée suffit à conclure que la donnée complète est inaccessible.",
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "DEVELOPMENT.md"
            path.write_text(weakened, encoding="utf-8")
            self.assertTrue(check_development(path))

    def test_codex_security_prompt_satisfies_guard(self):
        self.assertEqual(check_codex_security_prompt(Path("codex/SECURITY_REVIEW_PROMPT.md")), [])

    def test_codex_security_guard_rejects_plugin_weakening(self):
        source = Path("codex/SECURITY_REVIEW_PROMPT.md").read_text(encoding="utf-8")
        weakened = source.replace(
            "Utilise explicitement le plugin Security pour cette mission.",
            "Utilise les outils de sécurité disponibles pour cette mission.",
        )
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "prompt.md"
            path.write_text(weakened, encoding="utf-8")
            self.assertTrue(check_codex_security_prompt(path))


if __name__ == "__main__":
    unittest.main()
