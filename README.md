# Circuit Brain

An interactive course that teaches electronics from absolute zero up to designing, ordering
and debugging your own ESP32 boards. Lessons with live widgets, quizzes and spaced-repetition
flashcards, plus **the Lab**: a 3D breadboard with a real circuit simulator behind it, where
components light up, get hot, and burn out with an explanation of exactly why.

## Download it (Windows)

**→ [Latest release](../../releases/latest)** — grab `CircuitBrain-Setup-x.y.z.exe` and run it.

No Node.js, no terminal, nothing to set up.

Windows will say *"Windows protected your PC"*, because the installer is not code-signed
(a certificate costs a few hundred euro a year). Either:

- click **More info** → **Run anyway**, or
- right-click the downloaded file → **Properties** → tick **Unblock** → **OK**, then run it.

Every push also builds an installer you can grab from the **Actions** tab under
**Artifacts**, if you want a build newer than the last release.

It installs for the current user, adds a desktop shortcut, and runs fully offline apart from
loading its three web fonts.

## Want to change the lessons

The lessons are plain markdown in `curriculum/`, and they are yours to edit. Editing them
needs the dev setup rather than the installed app, because they are compiled into the build.

```bash
npm install
npm run dev      # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with instant reload |
| `npm test` | Unit tests: the maths, the solver, breadboard wiring |
| `npm run test:lab` | Browser tests for the Lab (needs `npm run dev` running) |
| `npm run check` | TypeScript typecheck |
| `npm run build` | Typecheck + production build into `dist/` |
| `npm run app` | Build and open the desktop app locally |
| `npm run app:pack` | Build the Windows installer (only works on Windows) |

## Where things are

| Path | What |
|---|---|
| `CLAUDE.md` | The rules: learner profile, teaching philosophy, accuracy rules |
| `curriculum/` | The lessons. `00-roadmap.md` is the full plan |
| `docs/DESIGN.md` | The design system |
| `docs/PROGRESS.md` | What is done, what is next, known issues |
| `docs/open-questions.md` | ESP32 specifics that must be verified before use |
| `src/lib/` | Maths and simulation — framework-free and unit-tested |
| `src/components/lab/` | The 3D workbench |

## Safety

Everything this course has you build runs from a USB port or a small battery. It never goes
near mains electricity, which in the Netherlands is 230 V and can kill you.
