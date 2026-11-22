import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("finiq_start", Path(__file__).with_name("start.py"))
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class EnvironmentTests(unittest.TestCase):
    def test_managed_uri_is_split_without_losing_tls(self):
        source = {"POSTGRES_CONNECTION_URI": "postgresql://reporter:p%40ss%3Aword@db.internal:5432/finiq?sslmode=require",
                  "RENDER_EXTERNAL_URL": "https://finiq.example.com", "PORT": "10000"}
        env = launcher.backend_environment(source)
        self.assertEqual(env["DATABASE_URL"], "jdbc:postgresql://db.internal:5432/finiq?sslmode=require")
        self.assertEqual(env["DB_PASSWORD"], "p@ss:word")
        self.assertEqual(env["DB_USER"], "reporter")
        self.assertNotIn("POSTGRES_CONNECTION_URI", env)
        self.assertEqual(env["FRONTEND_URL"], source["RENDER_EXTERNAL_URL"])
        self.assertEqual(env["PORT"], "8080")
        self.assertEqual(env["SERVER_ADDRESS"], "127.0.0.1")
        self.assertEqual(source["PORT"], "10000")

    def test_explicit_custom_domain_and_jdbc_are_preserved(self):
        env = launcher.backend_environment({"FRONTEND_URL": "https://custom.example.com",
                    "RENDER_EXTERNAL_URL": "https://fallback.example.com",
                    "DATABASE_URL": "jdbc:postgresql://db:5432/finiq", "DB_USER": "finiq"})
        self.assertEqual(env["FRONTEND_URL"], "https://custom.example.com")
        self.assertEqual(env["DATABASE_URL"], "jdbc:postgresql://db:5432/finiq")

    def test_invalid_managed_uri_is_rejected(self):
        for uri in ("https://example.com/db", "postgresql://user@db/finiq", "postgresql://u:p@db/"):
            with self.subTest(uri=uri), self.assertRaises(ValueError):
                launcher.backend_environment({"POSTGRES_CONNECTION_URI": uri})


if __name__ == "__main__":
    unittest.main()
