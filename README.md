# Afterglow

A JavaScript 3D street racing game with artistic night scenery, eight distinct cars, four neighborhoods, five weather settings, handbrake drifting, collision damage, breakable props, competitive AI, and LAN multiplayer.

## Run

Double-click the root `index.html` to play single-player directly in your browser. It contains the complete game, renderer, and styles and requires no server or installation.

For LAN multiplayer, with Node.js installed, run from the repository root:

```sh
npm start
```

Keep the server terminal open while playing LAN races; Ctrl+C stops it. Use its printed HTTP address for multiplayer. No npm dependencies are required.

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
public/          HTML template, styles, and classic JavaScript bundle
server/          Authoritative LAN server and static file serving
scripts/         Launcher and archive packaging
tests/           Handling, racing, UI, and LAN integration tests
dist/            Generated LAN download (ignored by Git)
package.json     Commands available from the repository root
index.html       Self-contained browser game
```

`src/street-game.js` is the browser entry. `src/simulation.js` shares race rules between browser and server; `src/free-driving.js` handles vehicle movement and contacts.

## Validate and package

```sh
npm test
npm run build
npm run package:lan
```

Tests cover handling, AI and race timing, UI startup with a stub renderer, prop breakage rendering, and a two-client LAN session. Packaging creates `dist/afterglow-lan.zip` using only JavaScript. Extract the archive and open `index.html` for single-player, or run `npm start` for LAN multiplayer. The generated download is served at `/afterglow-lan.zip` when present.

After editing game source or styles, run `npm run build` to refresh the standalone HTML and public bundle. Commit both generated browser files so the game can be opened straight from a checkout.
