# Improvement ideas

Ordered roughly by payoff for a LinkedIn audience.

## 1. Make it shareable — done
- "Share my result" button at the end, now a Wordle-style emoji grid of your week-by-week journey.
- Punchy end-state titles based on stats, for wins and losses.
- Open Graph and Twitter meta tags plus a preview image (`og-image.png`) so the link unfurls nicely on LinkedIn.
- Small footer credit and link back to Reframe Quality.

## 2. Add a little agency — done
- Power-ups with charges (up to 3), refillable from hiring-event cards.
- Community Chest hiring events that can move you, the rival, your morale, or grant power-ups.
- Six decision points, including 50/50 gambles.
- Role picker (Tester, Developer, BA, PM, CTO) with role-specific squares and opening salaries.
- Push-your-luck salary negotiation at the finish.

## 3. Visual polish — done
- Snake and ladder artwork drawn over the board (it was previously hidden underneath the squares).
- 3D dice, hopping tokens that slide down snakes and climb ladders, floating score text, screen shake, event cards, confetti, REJECTED / RESCINDED / POSITION FILLED stamps.
- Synthesised sound effects with a mute toggle.
- Respects `prefers-reduced-motion` throughout.

## 4. Replayability — done
- Random market conditions per run (extra snakes, extra ladders, rival tweaks, doubled events).
- A rival (the internal candidate) racing you: a real lose condition.
- Morale meter with burnout.
- Daily challenge: same market and dice for everyone, seeded by date.
- Trophy cabinet: 11 achievements, wins/played, fastest hire and top salary saved in localStorage.

## 5. Content
- Alternate lines on a handful of squares — started; extend to more squares.
- Second board variants: "Contractor edition", "Internal promotion edition".
- Crowdsource: invite connections to submit their worst recruiter moments (GitHub issue template).

## 6. Quality and accessibility — mostly done
- Keyboard: Space rolls, 1/2/3 power-ups, squares focusable. Done.
- Screen reader live region for log outcomes. Done.
- Colour-only tone cues: special squares now also carry icons; plain-square tone tints are still colour-only.
- Phones: fixed roll bar so the board stays visible. Done.

## 7. Publishing
- GitHub Pages hosting (private repos need a paid plan for Pages; otherwise make the repo public when ready, or use Netlify/Cloudflare Pages).
- Regenerate `og-image.png` to show the new board art.
- Add a licence and a short LinkedIn launch post draft ("Daily #N — can you beat my run?").
