# The Modern IT Recruitment Game

A snakes-and-ladders style satire of the modern IT hiring process. Pick a role, roll the dice, dodge the ATS, and try to beat 100:1 odds. Snakes heavily outnumber ladders, because the market is brutal right now.

Plain HTML, CSS and JavaScript. No build step, no dependencies. Open `index.html` in a browser (or serve the folder — the split files need `http://`/`https://` rather than `file://` for a clean load).

## Features

- Role picker (Tester, Developer, BA, PM, CTO) with a handful of role-flavoured squares.
- Power-ups: use your network (reroll), tailor your CV (+1), follow up politely (waive a snake bite).
- Community Chest squares draw a random hiring-event card (+/-1 or 2 squares).
- Decision-point squares offer a genuine two-way choice.
- Share button that copies your result, plus a punchy end-state title based on your stats.
- Open Graph / Twitter preview tags backed by `og-image.png`.

## Files

- `index.html` - page structure and social preview tags
- `styles.css` - styling, including the SVG snake/ladder art and animations
- `data.js` - all the content: snakes, ladders, chest cards, choice cards, roles, square text (edit the jokes here)
- `game.js` - game logic and rendering
- `og-image.png` - social share preview image (1200x630)
- `IMPROVEMENTS.md` - ideas backlog
