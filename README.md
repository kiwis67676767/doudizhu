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

## Files

| | |
|---|---|
| `doudizhu.html` | the entire game — rules, AI, UI, audio, translations |
| `server.js` | optional table server for link-based multiplayer |
