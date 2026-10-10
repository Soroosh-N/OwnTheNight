# Afterglow — JavaScript edition

A complete independent copy of the game. Browser gameplay and the Node.js LAN server use JavaScript. Three.js is included locally; no npm dependencies or build step are required.

On Windows, double-click `start-game.cmd`. It starts the server and opens the game in your browser. Keep its terminal open while playing.

Do not open `dist/index.html` directly: browsers restrict JavaScript module loading under `file://`. Always use the printed `http://localhost` address.

Alternatively, run from this directory:

```sh
npm start
```

Open the localhost address printed in the terminal. For multiplayer, other computers on the same network open the host's printed network address. Choose **LAN MULTIPLAYER**, create or join a room, then have the host start. Up to six players can race, with AI filling remaining seats. Allow Node.js on your private network if your firewall prompts.

The game includes eight distinct cars, four neighborhoods, five weather settings, nighttime lights, free off-road movement, handbrake drifting, finite nitro, competitive AI, collision damage, optional autopilot, and three-lap races.

| Control | Action |
| --- | --- |
| WASD / arrows | Accelerate, brake, steer |
| Space | Handbrake |
| Shift | Nitro |
| P | Autopilot |
| R | Recover to last checkpoint |
| Escape | Pause; room host only in LAN |

```sh
npm test
npm run package:lan
```

The tests cover shared physics, AI and lap timing, UI module startup with a stub renderer, and a two-client LAN session. The packaging command generates `dist/afterglow-lan.zip` entirely in JavaScript. Extract that archive and run `node lan-server.mjs` to host it.

`dist/street-game.js` is the browser entry; `dist/simulation.js` shares race rules between browser and server; `dist/free-driving.js` implements vehicle movement and contacts. Models, scenery, weather, damage, and LAN client are separate modules in `dist/`.

This directory contains the complete standalone JavaScript game and LAN server.
