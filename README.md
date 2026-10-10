# Own the Night

A browser-based 3D street racing game with artistic night scenery, handbrake drifting, and competitive races through lived-in neighborhoods. Built with JavaScript and Three.js.

## Features

- Eight car-inspired machines with distinct body styles and handling.
- Four maps: Midnight Coast, Neon District, Moonlight Ridge, and Industrial Docks.
- Clear skies, fog, rain, storms, and snow, with weather-dependent grip and visibility.
- Three-lap races, with dry-weather laps around 45 seconds depending on the car and driving.
- Free off-road movement, neighborhood boundaries, gentle car contacts, localized body damage, and breakable street furniture.
- Rivals of varying difficulty using the same physics and finite nitro tanks.
- Optional autopilot and browser multiplayer for up to six players.

## Play

Download or clone this repository, then open the root [index.html](index.html) in Chrome, Edge, or Firefox with WebGL enabled. The file contains the game, renderer, and styles: no terminal, installation, or local server is required. Single-player works offline.

Choose your car, neighborhood, and weather, then select **START NIGHT RUN**.

## Multiplayer

1. Everyone opens their copy of the game.
2. The host selects a car, map, and weather, opens **MULTIPLAYER**, and clicks **CREATE ROOM**.
3. Share the five-character code. Friends select their own cars, open **MULTIPLAYER**, enter the code, and click **JOIN**.
4. When everyone is ready, the host clicks **START ROOM RACE**. AI fills unused seats.

Multiplayer uses PeerJS signaling and WebRTC data channels, following [Emberwake's connection approach](https://github.com/MLMecham/emberwake/tree/70654ae2984848fce23b44cf9fdecc26dbafdeff/src/net). The host's browser runs the race; guests send driving inputs. No local multiplayer server is required.

**Internet is required to create and find room codes, even on the same LAN.** HTTP/HTTPS pages also offer invite links; directly opened files share codes. If a connection fails, check the code, keep the host's game open, and try the same Wi-Fi or hotspot. Some networks require a TURN relay; see [multiplayer setup and troubleshooting](docs/MULTIPLAYER.md).

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

Node.js is required for development commands. There are no npm dependencies to install.

| Command | Purpose |
| --- | --- |
| `npm run build` | Rebuild standalone `index.html` and `public/game.bundle.js` |
| `npm test` | Run handling, racing, peer, hosting, UI, and bundle checks |
| `npm run test:browser` | Check the generated standalone browser bundle |
| `npm start` | Optionally serve the game over HTTP and print its address |
| `npm run package:lan` | Build and create `dist/own-the-night-lan.zip` |

Run `npm run build` after changing source or styles; commit the generated root HTML and browser bundle. Packaging produces `dist/own-the-night-lan.zip`; extract it and open its `index.html`. Build and packaging use JavaScript without npm dependencies.

The optional HTTP server is useful for shareable invite links. It does not manage multiplayer rooms or simulate races.

## Repository layout

```text
index.html       Self-contained game; open this to play
src/             Game, physics, models, scenery, and weather modules
  net/           PeerJS connections and STUN/TURN configuration
  vendor/        Bundled Three.js, PeerJS, and PeerJS license
public/          HTML template, styles, and generated browser bundle
server/          Optional static HTTP server
scripts/         Build, packaging, and optional server launcher
tests/           Automated checks
docs/            Multiplayer setup and implementation notes
dist/            Generated archives; ignored by Git
```

Edit source modules and the public HTML/CSS template, then rebuild; avoid editing the generated root HTML or bundle by hand.

## Validation and credits

Automated tests cover physics, AI, static hosting, bundled startup, and peer connection flows using an in-memory transport. Live WebRTC across physical computers and NAT/relay routing require real-browser testing.

Rendering uses [Three.js](https://threejs.org/). Browser connections use [PeerJS](https://peerjs.com/), with its [MIT license](src/vendor/peerjs.LICENSE) included. Multiplayer connection design was informed by [Emberwake](https://github.com/MLMecham/emberwake); its inspected revision is documented in [MULTIPLAYER.md](docs/MULTIPLAYER.md).
