# 斗地主 · Dou Dizhu (Fight the Landlord)

A complete Dou Dizhu game in a single self-contained HTML file — no build step, no
dependencies, no assets to download. Open `doudizhu.html` in a browser and play.

![players](https://img.shields.io/badge/players-3-informational)
![deck](https://img.shields.io/badge/deck-54%20cards-informational)
![dependencies](https://img.shields.io/badge/dependencies-none-success)

## Playing

Open `doudizhu.html` directly — that is the whole game. One seat is yours, the other
two are bots.

Rules follow [pagat.com](https://www.pagat.com/climbing/doudizhu.html): 54 cards, 17
each with three face down, an auction for the landlord at 1–3, and all thirteen
combination types including airplanes with attachments, quadplex sets, bombs and the
rocket. Scoring is bid × bomb multiplier × spring.

- Click cards to select, **Play** to commit
- **Hint** cycles through every legal play
- <kbd>Enter</kbd> play · <kbd>Space</kbd> pass · <kbd>H</kbd> hint

## Playing with friends

Link-based tables need the bundled server (zero dependencies, plain Node):

```bash
node server.js
```

It prints an address such as `http://192.168.1.20:8080`. Open it, choose **Play with
friends**, and send the link it gives you. Whoever opens the table deals, and only ever
sends each player their own cards, so no hand travels to somebody who should not see
it. Empty seats are filled by bots, and if someone drops a bot takes over.

The same wifi is usually enough; over the internet, put a tunnel in front of the port.

## What's in it

- **Four bot difficulties.** Easy dawdles and misses tricks. Hard counts what has been
  played. Impossible sees every hand and searches the deal out — it wins about 90% of
  hands as landlord.
- **Chips.** A bank, a stake you pick per deal, doubling for bombs and springs, and
  table-stakes settlement.
- **45 achievements**, from long straights and five-bomb hands to win streaks.
- **Four languages** — English, 简体中文, 繁體中文, Español.
- **Settings** for language, difficulty, card size, table colour, music and effects.
- Music and sound effects synthesised in the browser with the Web Audio API.

## Multiplayer over Supabase

Filling in `SUPABASE_URL` and `SUPABASE_ANON_KEY` near the top of `doudizhu.html`
switches multiplayer onto Supabase Realtime, and `server.js` is no longer needed —
tables work from any static host, including Netlify.

- table messages travel on a broadcast channel per table
- each player's own cards go on a channel of their own, never the shared one
- Presence handles seating and disconnects
- no database tables, no auth, nothing stored — the publishable key is enough

**What this does not do:** the dealer's browser holds every hand, so the dealer can
see them, and player ids are visible in presence, so a player at the table could
subscribe to another player's channel and read their cards. Fine among friends,
not fine against strangers. Closing that properly means Realtime Authorization
policies with signed-in users — no game data in the database either way.

## Deploying

The game is static, so any static host will do. This repo carries a `netlify.toml`
that publishes the root and rewrites `/` to `doudizhu.html`, so connecting the repo
to Netlify is enough — every push to `main` redeploys.

The bots work exactly as they do locally. **Link-based multiplayer does not**: it
needs `server.js`, which keeps long-lived connections and in-memory table state that
static hosting cannot provide. Run that locally when you want to play with friends.

## Files

| | |
|---|---|
| `doudizhu.html` | the entire game — rules, AI, UI, audio, translations |
| `server.js` | optional table server for link-based multiplayer |
