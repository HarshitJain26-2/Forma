# Execution Scripts

This directory contains deterministic Python scripts that perform the actual work (API calls, data transformations, scraping, database operations, file generation, etc.).

### Rules:
- Keep scripts deterministic, reliable, and testable.
- Read credentials and settings from `.env`.
- Store temporary/intermediate files in `../.tmp/`.
- Handle errors gracefully and exit with descriptive messages.
