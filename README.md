# Afterglow

A JavaScript 3D street racing game with artistic night scenery, eight cars, four neighborhoods, five weather settings, drifting, collision damage, breakable props, competitive AI, and browser multiplayer for up to six players.

## Play

Open the root `index.html` directly in Chrome, Edge, or Firefox. No command window, installation, or local server is required. Single-player works offline.

## Multiplayer

1. Everyone opens their copy of the game.
2. The host selects a car, map, and weather, opens **MULTIPLAYER**, and clicks **CREATE ROOM**.
3. Share the five-character code. Friends select their own cars and enter the code to join.
4. The host starts the race. AI fills unused seats.

This follows [Emberwake's networking flow](https://github.com/MLMecham/emberwake/tree/70654ae2984848fce23b44cf9fdecc26dbafdeff/src/net): PeerJS public signaling, reliable raw WebRTC data channels, a host-owned simulation, and STUN/TURN routing. HTTP/HTTPS pages also offer invite links; directly opened files share codes. Internet is required to find room codes, even on the same LAN. Some networks need a TURN relay; see [multiplayer setup](docs/MULTIPLAYER.md).

The lobby shows DIRECT or RELAY routes. The host pauses the race when switching tabs. Disconnected guests become AI; if the host leaves, everyone must reconnect to a new room.

## Controls

| Control | Action |
| --- | --- |
| WASD / arrows | Accelerate, brake, steer |
| Space | Handbrake |
| Shift | Nitro |
| P | Autopilot |
| R | Recover to last checkpoint |
| Escape | Pause; host only in multiplayer |

## Development

`src/` contains game modules; `src/net/` contains WebRTC connections and relay configuration; `src/vendor/` includes Three.js and MIT-licensed PeerJS. `public/` contains the HTML template, styles, and generated browser bundle. `scripts/` contains build and packaging tools; `tests/` contains validation. `server/` is optional static hosting, with no game rooms or race simulation.

```sh
npm test
npm run build
npm run package:lan
```

Run `npm run build` after changing source or styles; commit the generated root HTML and browser bundle. Packaging produces `dist/afterglow-lan.zip`; extract it and open its `index.html`. Build and packaging use JavaScript without npm dependencies.

`npm start` optionally serves the same browser game over HTTP, useful for shareable invite links. Multiplayer does not require it.

Automated tests cover physics, AI, static hosting, bundled startup, and peer connection flows using an in-memory transport. Live WebRTC across physical computers and NAT/relay routing require real-browser testing.
