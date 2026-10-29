# The Modern IT Recruitment Game

**Play it:** https://reframequality.github.io/recruitment-game/

A snakes-and-ladders satire of the modern IT hiring process. Pick a role, survive the market, race the internal candidate to the offer, then decide how hard to negotiate. Snakes heavily outnumber ladders, because the market is brutal right now.

Plain HTML, CSS and JavaScript. No build step, no dependencies, no external assets (sounds are synthesised in the browser). Open `index.html` in a browser, or serve the folder from any static host.

## How it plays

- **The race.** The internal candidate (👔) moves 2–5 squares every week and never meets a snake. If they reach square 64 first, the role is theirs.
- **Market conditions.** Every job hunt draws a random market: AI screening everywhere (extra snakes), Funding boom (extra ladders), Hiring freeze, The CEO's nephew applied, Recruiter bonanza, Year-end budget flush, or a Steady market.
- **Morale.** Rejections drain it, good news restores it. Hit zero and you burn out and lose a week. High morale makes negotiating safer.
- **The offer.** Reaching square 64 opens a push-your-luck salary negotiation. Each push adds 8% at a rising risk (15% / 30% / 45% / 60%) of the offer being rescinded, which sends you back to square 47.
- **The start date.** Accepting isn't the end. Four times in five, something pulls the offer before day one: Finance pulls the budget, an Operating Model Review suspends onboarding, you're "overqualified", the CEO decides all new hires will be AI agents, and more.
- **Decisions.** Six decision squares, some of them 50/50 gambles.
- **Hiring events.** Community Chest cards that can move you, move the rival, change morale, or refill a power-up.
- **Power-ups.** Use your network (best of two dice), Tailor your CV (+1), Follow up politely (block a snake). Up to three charges each.
- **Daily challenge.** Everyone gets the same market and the same dice on the same day (seeded by date), so results are comparable. Share copies a Wordle-style emoji summary of your week-by-week journey.
- **Trophy cabinet.** Twelve achievements and personal records, kept in the browser's localStorage.

## Feel

3D tumbling dice, tokens that hop square to square, slide down the actual snake artwork and climb ladders, floating score text, a screen shake and REJECTED stamp on snake bites, event cards, confetti on a win, optional sound (mute button in the header). Keyboard: <kbd>Space</kbd> rolls, <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> use power-ups. Respects `prefers-reduced-motion`. On phones the roll button is pinned to the bottom so the board stays in view.

## Files

- `index.html` - page structure and social preview tags
- `styles.css` - styling and animations
- `data.js` - all the content: board layout, square text, decisions, event cards, markets, rival events, negotiation, achievements (edit the jokes here)
- `game.js` - game logic, rendering, sound and persistence
- `og-image.png` - social share preview image (1200x630)
- `IMPROVEMENTS.md` - ideas backlog

## Balance

Deliberately brutal, and tuned by simulation. A sensible player (uses power-ups, picks the safer options, accepts the first offer) gets hired about 1 time in 10: they lose the race to the internal candidate about half the time, and four in five offers that make it to the end are pulled before the start date. A player who ignores power-ups and picks at random is hired about 1 time in 16. The AI-screening market is the hardest, Year-end budget flush the easiest.

## Disclaimer

This is a work of satire, written with affection for everyone stuck in the hiring process, on either side of the table. Characters and scenarios are fictional and not based on any real person, recruiter or company. Product names mentioned (LinkedIn, Teams, Slack) are trademarks of their owners, who are not affiliated with or endorsing this game. Nothing here is career advice.

## Licence

[MIT](LICENSE). The software is provided as is, without warranty of any kind.
