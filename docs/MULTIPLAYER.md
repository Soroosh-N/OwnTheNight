# Browser multiplayer

The connection flow matches the current networking implementation in [Emberwake](https://github.com/MLMecham/emberwake/tree/70654ae2984848fce23b44cf9fdecc26dbafdeff/src/net):

1. A host registers a random five-character code with PeerJS's default public signaling service. Our IDs use `ownthenight-race-` to keep racing rooms separate from Emberwake rooms.
2. A guest opens their own `index.html`, enters the code, and connects with `reliable: true, serialization: 'raw'`.
3. JSON messages travel over WebRTC data channels. The signaling service exchanges connection information; it does not simulate the race.
4. The host runs the same shared vehicle physics for every driver and broadcasts race snapshots at 20 Hz. Guests send controls. Empty seats are AI.
5. HTTPS/HTTP pages can share an invite link using `#join-CODE`. A directly opened file shares the code instead, because the host's file path is not accessible on another computer.

The host pauses the entire race when switching tabs or opening the pause menu. A disconnected guest is replaced by AI. Guests stop receiving race updates when the host leaves; they must leave and join a new room.

## Connection routes

`src/net/relay.js` uses Emberwake's same Google STUN address and Metered Open Relay routes. The lobby displays **DIRECT** or **RELAY** after WebRTC selects a route.

Internet is required to register and find room codes, even when both computers are on the same LAN. A local Node server is not required. Some routers block direct connections; shared public TURN servers are not guaranteed to be available.

For your own relay, configure `relayConfig.meteredApp` and `relayConfig.meteredKey` in `src/net/relay.js`, then run `npm run build`. Use your own Metered TURN credential API key, not an administrative account credential. The browser bundle embeds these values. Relay routes are fetched and cached for 30 minutes. `globalThis.OWN_THE_NIGHT_PEER_OPTS` can override PeerJS signaling options for a private PeerServer.

## Reference and dependencies

Reference inspected: Emberwake commit `70654ae2984848fce23b44cf9fdecc26dbafdeff`, `src/net/net.js`, `src/net/relay.js`, and room/invite controls in `src/ui/main.js`. Our game-specific implementation is in `src/net/peer-client.js`. PeerJS is bundled from the reference's vendor asset; its upstream MIT license is included at `src/vendor/peerjs.LICENSE`.

The reference README mentions an offline webcam option, but that option is absent from this inspected commit's networking and UI source. This implementation follows the actual room-code connection code; it does not claim offline room discovery.

Automated tests exercise two peers using an in-memory PeerJS transport, host/guest permissions, race snapshots, prop damage, disconnects, and connection errors. They do not verify NAT traversal or a live public signaling session between two physical computers.
