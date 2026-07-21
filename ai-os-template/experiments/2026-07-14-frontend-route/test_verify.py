import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify.py")
SPEC = importlib.util.spec_from_file_location("frontend_route_verify", SCRIPT)
verify = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
sys.modules[SPEC.name] = verify
SPEC.loader.exec_module(verify)


def route_html(script: str) -> str:
    options = "".join(
        f'<option value="{state}">{state}</option>'
        for state in ("available", "limited", "unavailable")
    )
    controls = "".join(
        f'<label for="{provider}-status">{provider}</label>'
        f'<select id="{provider}-status">{options}</select>'
        for provider in ("codex", "zai", "cursor")
    )
    return f"""<!doctype html>
<html>
  <head>
    <style>
      :root {{ color: oklch(20% 0 0); }}
      :focus-visible {{ outline: 2px solid; }}
      @media (max-width: 40rem) {{ main {{ display: block; }} }}
      @media (prefers-reduced-motion: reduce) {{ * {{ transition: none; }} }}
    </style>
  </head>
  <body>
    <main>
      {controls}
      <p id="route-summary" aria-live="polite"></p>
      <p id="latest-event" aria-live="polite"></p>
      <ol><li>Fallback</li></ol>
      <p>GLM-5.2 Terra Composer Sol High Codex Z.ai Cursor Latest event</p>
    </main>
    <script>
      const textContent = "change";
      document.addEventListener("change", () => {{}});
      {script}
    </script>
  </body>
</html>
"""


class VerifyTests(unittest.TestCase):
    def check_html(self, html: str) -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "index.html"
            path.write_text(html, encoding="utf-8")
            return verify.check(path)

    def test_function_definition_is_not_an_initial_route_calculation(self):
        failures = self.check_html(
            route_html("function updateRoute(initial) { anyStatement(); }")
        )
        self.assertIn("route must calculate on initial load", failures)

    def test_identifier_containing_inner_html_is_not_forbidden_api_use(self):
        failures = self.check_html(
            route_html(
                "function updateInnerHtmlContent() {} updateRoute(\"initial\");"
            )
        )
        self.assertNotIn("forbidden pattern: innerHTML", failures)

    def test_actual_inner_html_api_use_remains_forbidden(self):
        failures = self.check_html(
            route_html(
                'document.body.innerHTML = "unsafe"; updateRoute("initial");'
            )
        )
        self.assertIn("forbidden pattern: innerHTML", failures)

    def test_latest_event_requires_its_own_polite_live_region(self):
        html = route_html('updateRoute("initial");').replace(
            'id="latest-event" aria-live="polite"', 'id="latest-event"'
        )
        failures = self.check_html(html)
        self.assertIn("latest event updates must use aria-live=polite", failures)


if __name__ == "__main__":
    unittest.main()
