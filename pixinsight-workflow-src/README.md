ä# PixDoc

Projekt mit dem MkDocs-Theme und Plugin `mkdocs-material` zur Dokumentation eines PixInsight-Workflows.

## Voraussetzungen

- Docker Desktop oder Docker Engine mit Compose

## Lokale Vorschau starten

```bash
docker compose up
```

Dann im Browser oeffnen:

- <http://localhost:8000>

## Lokale Vorschau stoppen

```bash
docker compose down
```

## Produktion bauen (optional)

```bash
docker compose run --rm docs build
```

Die generierten statischen Dateien liegen danach im Ordner `site/`.

## GitHub Pages

Dieser Ordner wird per GitHub Actions automatisch an GitHub Pages deployt, wenn Änderungen auf `main` oder `master` gepusht werden.
