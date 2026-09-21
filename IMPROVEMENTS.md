# Improvement ideas

Ordered roughly by payoff for a LinkedIn audience.

## 1. Make it shareable — done
- "Share my result" button at the end: copies text like *"I got the job in 41 rounds, 12 rejections, 7 moments of false hope..."* to the clipboard.
- Punchy end-state titles based on stats (e.g. "Ghosted 10 times: Resilience Level Expert", "Suspiciously lucky").
- Open Graph and Twitter meta tags plus a preview image (`og-image.png`) so the link unfurls nicely on LinkedIn.
- Small footer credit and link back to Reframe Quality.

## 2. Add a little agency — done (currently pure luck)
- Limited-use power-ups: "Use your network" (best of two on the next roll), "Tailor the CV" (+1 to next roll), "Follow up politely" (waive one snake bite).
- Community Chest squares draw a random hiring-event card that nudges you 1-2 squares forward or back.
- Decision-point squares present a genuine choice with different outcomes either way.
- Pick your persona (Tester, Developer, BA, PM, CTO) with role-specific squares and jokes.
- Snakes now heavily outnumber ladders (10 vs 4), reflecting how hard the market is right now.

## 3. Visual polish — done
- Real snake and ladder artwork drawn as an SVG overlay across the board instead of only arrow icons.
- Confetti on win, a rubber-stamp "REJECTED" animation on snake bites (plus a subtle permanent watermark on snake squares).
- Respects `prefers-reduced-motion` throughout (dice, movement, confetti, stamp).

## 4. Replayability
- Random event deck layered over the fixed board so repeat plays differ.
- Best and worst run saved in localStorage; "worst rejection streak" stat.
- Second board variants: "Contractor edition", "Internal promotion edition".

## 5. Content
- Add 2 or 3 alternate lines per square so repeat plays stay fresh.
- Crowdsource: invite connections to submit their worst recruiter moments (GitHub issue template).

## 6. Quality and accessibility
- Keyboard: roll with Space/Enter, squares focusable.
- `aria-live` on the log so screen readers hear outcomes.
- Colour-only tone cues on squares need a second cue (icon or pattern).
- Minor: the fixed 8x8 board gets tiny on narrow phones; test at 360px.

## 7. Publishing
- GitHub Pages hosting (private repos need a paid plan for Pages; otherwise make the repo public when ready, or use Netlify/Cloudflare Pages).
- Add a licence and a short LinkedIn launch post draft.
