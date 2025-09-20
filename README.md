# Dendy Tetris (Battle City style)

Статическая веб‑игра Tetris в стилистике "Танчики" (NES/Dendy), без сборщиков и зависимостей.

## Локальный запуск

```bash
python3 -m http.server 8000
# открыть http://localhost:8000
```

## Управление

- ← →: перемещение
- ↓: мягкое падение
- Z/X или ↑: вращение
- Space: хард‑дроп
- На мобильных: экранные кнопки

## Деплой на GitHub Pages

1. Создайте репозиторий и запушьте файлы.
2. В Settings → Pages выберите "Deploy from a branch" и ветку `main`, папка `/`.
3. Ссылка появится вида: `https://<username>.github.io/<repo>/`.

Команды:

```bash
git init
git add .
git commit -m "init dendy tetris"
git branch -M main
git remote add origin git@github.com:<username>/<repo>.git
git push -u origin main
```

## Лицензия
MIT
