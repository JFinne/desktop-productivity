# Fokus

A local-only desktop productivity app: Pomodoro timer, to-do lists and a calendar,
in a deliberately quiet, bezel-less window. Nothing it stores ever leaves the machine.

Built with **Tauri 2 + SvelteKit 2 (Svelte 5, TypeScript)**.

## Running it

```
npm install
npm run tauri dev      # the real app
npm run dev            # frontend only, in a browser (storage falls back to localStorage)
```

Run the Tauri commands from **PowerShell or cmd**, not Git Bash — Git Bash's `link`
shadows the MSVC linker and the Rust build fails with `link: extra operand`.

## Layout

```
src/
  app.css                    base layout/type; colours come from the active theme
  lib/
    storage.ts               read/write JSON stores (Tauri commands, localStorage fallback)
    persisted.svelte.ts      Persisted<T>: a $state value mirrored to a JSON store
    registry.svelte.ts       what tools + settings sections exist
    themes/                  theme token maps and the applier
    settings/                settings shape, defaults, and the shell's own sections
    components/              TitleBar, Sidebar, Icon, settings controls
    tools/<id>/tool.ts       one folder per tool; registers itself with the shell
  routes/<id>/+page.svelte   the tool's page
src-tauri/
  src/storage.rs             JSON files under <app data>/data/<key>.json, atomic writes
```

## Adding a tool

1. `src/lib/tools/<id>/tool.ts` — call `registerTool({ id, label, path, icon, order })`.
2. Add `import './<id>/tool';` to `src/lib/tools/index.ts`.
3. Create `src/routes/<id>/+page.svelte`.
4. Optional: add defaults to `AppSettings` in `settings/defaults.ts` and call
   `registerSettingsSection(...)` — the Settings page renders it automatically.

Nothing in the shell needs editing.

## Focus (Pomodoro)

Timing is anchored to the wall clock rather than counted in interval ticks, so the
countdown never drifts and survives a throttled or descheduled tab. The whole timer
state is persisted: quitting mid-session and reopening resumes where you left off, and
a session that ended while Fokus was closed is counted but does not fire a late alarm
or auto-start the next phase.

Alarm sounds are synthesised with the Web Audio API (`tools/focus/sounds.ts`) rather
than shipped as audio files — nothing to load, and Settings can preview them instantly.
Add one by appending to `alarmSounds`; it shows up in the picker automatically.

You can also use your own audio file. Importing copies it into `<app data>/sounds/`
(`src-tauri/src/sounds.rs`), so moving or deleting the original is safe, and playback
reads the bytes back through Rust into a blob URL rather than opening a filesystem
scope to arbitrary paths. Settings stores the choice as `custom:<id>`.

When a round ends, Fokus also raises a desktop notification, so a finished round is
visible behind other windows. In `tauri dev` the toast is attributed to the launching
terminal rather than to Fokus; a bundled build registers its own app identity.

A running session shows as a countdown in the sidebar and title bar. That comes from the
optional `status()` on a registered tool, so any future tool can surface a live badge the
same way.

## Tasks

Tasks carry a category and a scheduled day (`YYYY-MM-DD`, or null for the Someday
backlog), and the page groups them into Overdue / Today / each upcoming day / Someday /
Completed. Deleting a category leaves its tasks alone and simply uncategorises them.

### Category colours

A category's `color` is either a literal hex — what the picker writes — or one of the
theme token names (`accent`, `info`, `success`, `warning`, `danger`, `muted`) that older
category files use. Tokens follow the theme; a hex stays put, which is the point of
choosing one. Both resolve through `colorVar` / `resolveColor` in the tasks store, so
nothing needed migrating when the picker arrived.

The picker offers twelve preset colours plus a Custom row backed by a native
`<input type="color">`, which opens the OS colour dialog — a spectrum and an eyedropper
for free, and no dependency.

Two things make an arbitrary colour safe on ten different backgrounds:

- **As text** (the category name in a task row) it goes through `colorText`, which mixes
  the colour toward white or black until it clears 4.5:1 on the current theme, preserving
  hue. Banana renders `#E3B341` on Abyss and `#886B27` on Sunset.
- **As a dot** it is drawn at full strength with a hairline ring (`--swatch-ring` in
  `app.css`, which flips with `data-mode`). Pale colours would otherwise disappear —
  Banana is under 2:1 against Desert's sand — and tinting the dot would misrepresent the
  colour the user picked.

With "carry unfinished tasks forward" on, anything still open from a past day moves to
today at launch, which is how a list you didn't finish feeds the next focus session.
Completed tasks keep their original date, so history stays honest.

Dates are local `YYYY-MM-DD` strings everywhere (`lib/date.ts`) — never `toISOString()`,
which converts to UTC and lands on the wrong day in the evening west of Greenwich. The
string form also sorts correctly with `<`, which is why comparisons are lexicographic.

## Calendar

Month and week views over the same task store — the calendar owns no data of its own,
it is a second way of looking at `tasks.json`.

Dragging a task chip onto a day reschedules it, and the Someday strip above the grid is
both a list of unscheduled tasks and a drop target, so a day can hand a task back. Chips
only show and move a task; completing and editing happen in the day panel below the grid,
where a stray click can't tick something off by accident.

The month grid is always six rows so it doesn't change height as you page through months.

**`dragDropEnabled: false`** in `tauri.conf.json` is load-bearing. Tauri registers an
OS-level file-drop handler on the window by default, and on Windows that swallows HTML5
drag-and-drop inside the webview — chips would select as text instead of lifting. Fokus
never accepts dropped files (sound import goes through a dialog), so turning it off costs
nothing. Don't re-enable it without replacing the calendar's drag interaction.

## Themes

Ten themes, five dark and five light, in `themes/themes.ts`. Each one is a flat token
map; adding another means adding an entry to the `themes` array and nothing else — the
picker, the settings page and every component read the same tokens.

Unlike a scheme that drops a coloured accent onto neutral grey, each theme tints its
whole surface: Forest genuinely sits on deep green, Abyss on navy, Desert on warm sand.
The two Classic themes stay near-neutral so there is always somewhere quiet to land.

**`accent` is a foreground colour more often than a fill** — link text, the active nav
icon, the running countdown, focused borders. That means the light themes need a deep,
saturated accent rather than a pastel one: a pale gold on white is unreadable. All five
light accents are dark enough to pass as body text.

Every palette is checked against WCAG AA by `npm run check:contrast`: `text` ≥ 7:1,
`textMuted` / `accent` / `danger` / `info` / `success` / `warning` ≥ 4.5:1, `textFaint`
≥ 3:1, and `accentText` ≥ 4.5:1 on an `accent` fill. All ten pass. Run it after changing any
colour rather than trusting the eye — several of the light accents needed darkening by a
shade or two to clear the bar. Passing `--fix` nudges failing colours toward the nearest
compliant shade of the same hue.

Category colours are stored as *token names* (`accent`, `info`, `success`, `warning`,
`danger`, `muted`) rather than literal hex, so a task category keeps its meaning and its
contrast in every theme.

A settings file naming a theme that no longer exists falls back to Classic Dark, and the
resolved id is written back so the picker's selection stays honest.

## Data

Settings and (later) tasks live as readable JSON in the OS app-data folder; the exact
path is shown under **Settings → Data**. Missing keys are filled from defaults on load,
so an old file survives new features.
