# FinIQ Java API

Java 17 / Spring Boot 3.5, Spring Security JWT, BCrypt, Bean Validation, Spring Data JPA/JDBC, Flyway and PostgreSQL. Maven builds the API. No H2 or in-memory replacement is used.

Set DATABASE_URL, DB_USER, DB_PASSWORD and JWT_SECRET. ML_URL defaults to http://localhost:8001. Run `mvn spring-boot:run`, or use the root environment-aware launcher. `/docs` serves Swagger; `/actuator/health` is the health check.

Use the root backend test helper to create a separate test database. Integration tests require the live ML service and assert non-fallback inference methods. The deployment image packages with tests skipped; the verification workflow runs tests before packaging.

Account persistence uses JPA. SQL reporting and append-only records use parameterized JdbcTemplate queries under the same Spring transaction manager. Topic relationships are mapped explicitly. Database constraints and migration triggers preserve relational integrity and timestamps. See `docs/architecture.md` for endpoint and security contracts.
