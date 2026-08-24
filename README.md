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
Completed. Categories are user-defined and store a *theme token name* rather than a
literal colour, so a category keeps its meaning when the theme changes; deleting one
leaves its tasks alone and simply uncategorises them.

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

## The daylight cycle

`Settings → Daylight cycle` replaces the fixed theme with a palette that follows the sun
where you are. It is computed on the machine — `themes/sun.ts` implements the standard
low-precision solar position algorithm, so nothing is looked up online. Longitude is
guessed from the machine's UTC offset; latitude has to be entered, and the sunrise time
shown in Settings is the quickest way to confirm it is right.

Rather than switching themes at fixed clock times, `themes/circadian.svelte.ts`
interpolates continuously against the sun's **elevation**. Two things fall out of that:
the shift is slow enough that you never catch it happening, and it tracks the seasons —
a January afternoon reaches a lower, warmer part of the ramp than a June one. Below the
horizon the ramp splits on whether the sun is rising or setting, because the same
altitude should read as rose-tinted dawn or violet dusk depending on which way it is
going. Midday is Ayu Dark exactly, so the app's resting look is home base.

Everything stays dark by default; the point is mood, not brightness. "Go light in the
daytime" swaps the two high-sun stops for light palettes.

**Light and dark palettes are never blended.** Interpolating one into the other passes
through mid-grey, where the background and the text meet in the middle and contrast
collapses to about 2.5:1 for the best part of an hour. `paletteFor` steps across that
boundary instead, which puts the switch just above the horizon: light while the sun is
up, dark once it has set. Every palette is checked to clear WCAG AA — across a full-day
sweep the worst body text is 8.9:1 and the worst muted text 4.6:1.

The preview slider in Settings scrubs the day without waiting for it, and resets when you
leave the page so you can never strand the app on a previewed hour.

## Data

Settings and (later) tasks live as readable JSON in the OS app-data folder; the exact
path is shown under **Settings → Data**. Missing keys are filled from defaults on load,
so an old file survives new features.
