import tempfile
import unittest
from pathlib import Path

from tools.check_codex_security_prompt import check_prompt as check_codex_security_prompt
from tools.check_review_governance import check_development


class ReviewGovernanceTests(unittest.TestCase):
    def test_development_contains_permanent_contracts(self):
        self.assertEqual(check_development(Path("DEVELOPMENT.md")), [])

    def _assert_development_rejects_replacement(self, original: str, replacement: str = ""):
        source = Path("DEVELOPMENT.md").read_text(encoding="utf-8")
        self.assertIn(original, source)
        weakened = source.replace(original, replacement)
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "DEVELOPMENT.md"
            path.write_text(weakened, encoding="utf-8")
            self.assertTrue(check_development(path))

    def test_development_guard_rejects_removed_tool_rule(self):
        self._assert_development_rejects_replacement(
            "Une réponse tronquée, paginée ou limitée en taille ne constitue pas à elle seule une preuve que la donnée complète est inaccessible.",
            "Une réponse tronquée suffit à conclure que la donnée complète est inaccessible.",
        )

    def test_development_guard_rejects_premature_manual_transfer(self):
        self._assert_development_rejects_replacement(
            "L'agent ne doit déclarer une opération techniquement inaccessible qu'après avoir vérifié qu'aucun moyen raisonnable disponible dans son environnement ne permet de l'accomplir sans transfert manuel inutile.",
            "L'agent peut déclarer une opération techniquement inaccessible après l'échec d'un premier chemin disponible.",
        )

    def test_development_guard_rejects_removed_permission_boundary(self):
        self._assert_development_rejects_replacement(
            "Cette règle n'oblige pas à contourner une permission, une restriction de sécurité, un périmètre autorisé ou une limitation réelle de l'outil."
        )

    def test_development_guard_rejects_removed_claude_state_check(self):
        self._assert_development_rejects_replacement(
            "Elle doit demander à Claude de vérifier cet état avant l'analyse, imposer `ÉTAT OBSOLÈTE` en cas de divergence et interdire de remplacer silencieusement les sources autorisées par une mémoire de mission précédente, des connaissances de projet potentiellement périmées ou un accès supposé à une autre source."
        )

    def test_development_guard_rejects_removed_unverifiable_clause(self):
        self._assert_development_rejects_replacement(
            "Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d'établir ; les éléments nécessaires mais non démontrables doivent rester explicitement `INVÉRIFIABLE`."
        )

    def test_development_guard_rejects_removed_ci_evidence_limit(self):
        self._assert_development_rejects_replacement(
            "Lorsque des templates de prompts versionnés matérialisent ces contrats, leurs clauses obligatoires doivent être protégées par un contrôle mécanique proportionné. Une CI verte ne prouve cependant que la présence des clauses contrôlées ; elle ne prouve pas qu'un reviewer externe a effectivement exécuté le plugin ou respecté toutes les instructions."
        )

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
