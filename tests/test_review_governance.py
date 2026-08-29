from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from tools.check_codex_security_prompt import check_prompt as check_codex_security_prompt
from tools.check_review_governance import check_development


class ReviewGovernanceTests(unittest.TestCase):
    def test_development_contains_permanent_contracts(self) -> None:
        self.assertEqual(check_development(Path("DEVELOPMENT.md")), [])

    def _assert_development_rejects_replacement(
        self, original: str, replacement: str = ""
    ) -> None:
        source = Path("DEVELOPMENT.md").read_text(encoding="utf-8")
        self.assertIn(original, source)
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "DEVELOPMENT.md"
            path.write_text(source.replace(original, replacement), encoding="utf-8")
            self.assertTrue(check_development(path))

    def test_development_guard_rejects_removed_tool_availability_rule(self) -> None:
        self._assert_development_rejects_replacement(
            "Avant de déclarer qu'une opération autorisée est impossible ou de demander à Mickaël de l'effectuer manuellement, l'agent doit vérifier les moyens raisonnables déjà disponibles pour accomplir l'opération."
        )

    def test_development_guard_rejects_premature_manual_transfer(self) -> None:
        self._assert_development_rejects_replacement(
            "L'agent ne doit déclarer une opération techniquement inaccessible qu'après avoir vérifié qu'aucun moyen raisonnable disponible dans son environnement ne permet de l'accomplir sans transfert manuel inutile."
        )

    def test_development_guard_rejects_removed_permission_boundary(self) -> None:
        self._assert_development_rejects_replacement(
            "Cette règle n'oblige pas à contourner une permission, une restriction de sécurité, un périmètre autorisé ou une limitation réelle de l'outil."
        )

    def test_development_guard_rejects_removed_claude_state_check(self) -> None:
        self._assert_development_rejects_replacement(
            "Elle doit demander à Claude de vérifier cet état avant l'analyse, imposer `ÉTAT OBSOLÈTE` en cas de divergence et interdire de remplacer silencieusement les sources autorisées par une mémoire de mission précédente, des connaissances de projet potentiellement périmées ou un accès supposé à une autre source."
        )

    def test_development_guard_rejects_removed_unverifiable_clause(self) -> None:
        self._assert_development_rejects_replacement(
            "Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d'établir ; les éléments nécessaires mais non démontrables doivent rester explicitement `INVÉRIFIABLE`."
        )

    def test_development_guard_rejects_codex_security_overuse(self) -> None:
        self._assert_development_rejects_replacement(
            "Le plugin Security ne doit être demandé que lorsqu'une contre-vérification Codex Security est réellement nécessaire pour couvrir une propriété de sécurité ou un risque que Codex normal ne couvre pas suffisamment."
        )

    def test_development_guard_rejects_security_plugin_in_normal_prompt(self) -> None:
        self._assert_development_rejects_replacement(
            "Lorsqu'une revue Codex normale suffit, le prompt ne doit pas demander l'utilisation du plugin Security."
        )

    def test_development_guard_rejects_default_security_escalation(self) -> None:
        self._assert_development_rejects_replacement(
            "Le surclassement vers Codex Security par défaut, par simple précaution générale ou sans gain de preuve identifié est interdit."
        )

    def test_development_guard_rejects_removed_ci_evidence_limit(self) -> None:
        self._assert_development_rejects_replacement(
            "Lorsque des templates de prompts versionnés matérialisent ces contrats, leurs clauses obligatoires doivent être protégées par un contrôle mécanique proportionné. Une CI verte ne prouve cependant que la présence des clauses contrôlées ; elle ne prouve pas qu'un reviewer externe a effectivement exécuté le plugin ou respecté toutes les instructions."
        )

    def test_development_guard_rejects_removed_risk_goal(self) -> None:
        self._assert_development_rejects_replacement(
            "Le but n'est pas de supprimer tout risque."
        )

    def test_development_guard_rejects_removed_risk_visibility_contract(self) -> None:
        self._assert_development_rejects_replacement(
            "Le but est que les risques importants soient détectés, rendus visibles, traités au bon niveau et jamais masqués pour permettre au développement de continuer."
        )

    def test_codex_security_prompt_contract_is_valid(self) -> None:
        self.assertEqual(
            check_codex_security_prompt(Path("codex/SECURITY_REVIEW_PROMPT.md")), []
        )

    def test_codex_security_prompt_rejects_plugin_weakening(self) -> None:
        source = Path("codex/SECURITY_REVIEW_PROMPT.md").read_text(encoding="utf-8")
        weakened = source.replace(
            "Utilise explicitement le plugin Security pour cette mission.",
            "Utilise Codex pour cette mission.",
        )
        with tempfile.TemporaryDirectory() as tmp_dir:
            path = Path(tmp_dir) / "SECURITY_REVIEW_PROMPT.md"
            path.write_text(weakened, encoding="utf-8")
            self.assertTrue(check_codex_security_prompt(path))


if __name__ == "__main__":
    unittest.main()
