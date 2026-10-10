# Afterglow

A JavaScript 3D street racing game with artistic night scenery, eight distinct cars, four neighborhoods, five weather settings, handbrake drifting, collision damage, breakable props, competitive AI, and LAN multiplayer.

## Run

With Node.js installed, run from the repository root:

```sh
npm start
```

On Windows, double-click `start-game.cmd`. Keep its terminal open while playing; Ctrl+C stops it. No npm dependencies or build step are required. Use the printed HTTP address; opening `public/index.html` directly cannot load the game's modules.

## LAN multiplayer

Other computers on the same network open the host's printed network address. Choose **LAN MULTIPLAYER**, create or join a room, and have the host start. Up to six players can race, with AI filling remaining seats. Allow Node.js on your private network if your firewall prompts.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrows | Accelerate, brake, steer |
| Space | Handbrake |
| Shift | Nitro |
| P | Autopilot |
| R | Recover to last checkpoint |
| Escape | Pause; room host only in LAN |

## Project layout

```text
src/             Game, physics, models, scenery, weather, and LAN client
  vendor/        Bundled Three.js
public/          HTML, stylesheets, and launch notice
server/          Authoritative LAN server and static file serving
scripts/         Launcher and archive packaging
tests/           Handling, racing, UI, and LAN integration tests
dist/            Generated LAN download (ignored by Git)
package.json     Commands available from the repository root
start-game.cmd   Windows launcher
```

`src/street-game.js` is the browser entry. `src/simulation.js` shares race rules between browser and server; `src/free-driving.js` handles vehicle movement and contacts.

## Validate and package

```sh
npm test
npm run package:lan
```

Tests cover handling, AI and race timing, UI startup with a stub renderer, prop breakage rendering, and a two-client LAN session. Packaging creates `dist/afterglow-lan.zip` using only JavaScript. Extract the archive and run `npm start` or its Windows launcher. The generated download is served at `/afterglow-lan.zip` when present.
