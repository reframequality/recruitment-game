const COLS = 8, ROWS = 8, TOTAL = COLS*ROWS;

// classic boustrophedon numbering: row 0 = bottom row, squares 1-8 left-to-right
function squareNumber(row, col){
  if(row % 2 === 0) return row*COLS + col + 1;
  return row*COLS + (COLS - col);
}

// ladders: start -> end (forward, good news)
const LADDERS = { 4:14, 9:31, 20:38, 28:50, 40:59, 51:62 };
// snakes: start -> end (backward, bad news)
const SNAKES = { 17:2, 24:10, 33:6, 42:21, 56:13, 61:19 };

const LADDER_TEXT = {
  4: "CV passes the initial screen. A human, allegedly, looked at it.",
  9: "Recruiter calls back within 48 hours. This is treated as a personality trait.",
  20: "You're invited to a first-stage interview. It's on Teams. It's fine.",
  28: "Hiring manager actually references something specific from your CV.",
  40: "You clear the technical round. The 'technical round' was a chat about culture fit.",
  51: "Verbal offer given over the phone. You are told 'don't quote me on the number yet'."
};
const SNAKE_TEXT = {
  17: "ATS auto-rejects you 4 seconds after submission. It did not enjoy your 25 years of experience.",
  24: "Recruiter goes dark. LinkedIn shows they left the agency three weeks ago.",
  33: "Salary wasn't listed. You gave a number. You never hear from them again.",
  42: "'We've decided to go in a different direction.' Direction: unspecified, forever.",
  56: "Final interview. Told you're 'overqualified', which you suspect means 'too expensive'.",
  61: "The role is quietly reopened as 'urgent' the day after rejecting you."
};

// Every non-special square (1-63, minus ladder/snake starts) has its own fixed
// line and tone: pos, neg, twist (absurd), or neutral.
const SQUARE_TEXT = {
  1:  { tone:'neutral', text:"No jobs today. Better luck tomorrow." },
  2:  { tone:'pos',     text:"Congratulations, you get to apply for a role today." },
  3:  { tone:'neg',     text:"A recruiter pings you on LinkedIn about an 'opportunity'. Turns out they just want the names of hiring managers where you currently work." },
  5:  { tone:'neutral', text:"You spend the evening tailoring your CV to match keywords in a job spec that closes in six hours." },
  6:  { tone:'neg',     text:"A recruiter asks for your 'current package' before telling you anything about the role." },
  7:  { tone:'neutral', text:"You update your LinkedIn headline. Nobody notices." },
  8:  { tone:'neutral', text:"An old colleague forwards you a job ad 'just in case'. It's not in case of anything relevant." },
  10: { tone:'neg',     text:"You spend an hour filling in an application form that asks for information already on your attached CV." },
  11: { tone:'neutral', text:"A recruiter calls just to 'touch base'. Nothing has changed since last time. Nothing will." },
  12: { tone:'pos',     text:"You find a role that looks genuinely interesting. You apply immediately, before overthinking it." },
  13: { tone:'neg',     text:"The application portal crashes halfway through. You start again from page one." },
  14: { tone:'pos',     text:"A friend who works at the company puts in a good word for you." },
  15: { tone:'neutral', text:"You get an automated email confirming receipt of your application. This is the last you'll hear of it." },
  16: { tone:'neg',     text:"You spend Saturday morning prepping for an interview that gets rescheduled by email at 8:58am Monday." },
  18: { tone:'neutral', text:"You're added to a recruiter's 'talent pool'. You are never removed, contacted, or told what this means." },
  19: { tone:'neutral', text:"A job spec lists 'salary: competitive'. You apply anyway, hoping." },
  21: { tone:'neutral', text:"You get invited to a networking event. Everyone there is also job hunting." },
  22: { tone:'pos',     text:"Someone on your former team recommends you internally at their new company." },
  23: { tone:'neg',     text:"You're ghosted after a promising first call. You never learn why." },
  25: { tone:'neg',     text:"You spend twenty minutes writing a cover letter for a portal with no cover letter field." },
  26: { tone:'neg',     text:"A recruiter says 'leave it with me' and does not, in fact, leave it with themselves." },
  27: { tone:'neg',     text:"You get a LinkedIn message: 'Loved your profile, are you open to new opportunities?' It's for a role two levels junior." },
  29: { tone:'neutral', text:"You spot a typo in your own CV. It has been there for three months." },
  30: { tone:'neg',     text:"A recruiter sends you a role you already turned down in March. They don't remember." },
  31: { tone:'twist',   text:"You practice interview answers out loud in the car. A passer-by gives you a concerned look." },
  32: { tone:'neutral', text:"You get a genuinely thoughtful rejection email, with feedback. This is rarer than the job itself." },
  34: { tone:'neg',     text:"You spend the weekend building a portfolio piece nobody asked for and nobody will see." },
  35: { tone:'pos',     text:"A recruiter is enthusiastic, responsive, and clearly good at their job. You are suspicious." },
  36: { tone:'neg',     text:"You're invited to a 'quick chat', which turns out to be a fully structured 90-minute interview." },
  37: { tone:'neg',     text:"An interviewer asks a question your CV already answers, in the paragraph they are currently holding." },
  38: { tone:'neg',     text:"You're told the hiring manager 'really liked' you. The role is put on hold the next day." },
  39: { tone:'neutral', text:"You update your notice period on every job board simultaneously, then immediately regret it." },
  41: { tone:'neg',     text:"A recruiter asks if you can 'do a quick task' before the first interview. The task takes four hours." },
  43: { tone:'neg',     text:"Someone claiming to be a 'talent partner' messages you. Their calendar link expires in nine minutes." },
  44: { tone:'twist',   text:"You're asked to complete a personality test. The results suggest you should be a florist." },
  45: { tone:'pos',     text:"You turn down a role because the salary band, once it finally appears, is insulting." },
  46: { tone:'pos',     text:"A former manager writes you a genuinely glowing reference, unprompted." },
  47: { tone:'neg',     text:"You're told the process will take 'two weeks, max'. It takes eleven." },
  48: { tone:'neutral', text:"You get offered an interview slot at 7am. You take it anyway." },
  49: { tone:'neg',     text:"A recruiter forgets your name mid-call and uses the previous candidate's instead." },
  50: { tone:'twist',   text:"You spend an evening researching a company that ghosted you two months ago, just in case they call back." },
  52: { tone:'neutral', text:"You're asked in an interview where you see yourself in five years. You do not say 'not doing this again'." },
  53: { tone:'neg',     text:"The panel asks you to solve a problem they haven't solved internally in three years." },
  54: { tone:'neg',     text:"You're told there's 'no news yet', for the fourth week running." },
  55: { tone:'pos',     text:"A recruiter you liked working with reaches out about a completely different, better-fitting role." },
  57: { tone:'neg',     text:"You get feedback that you were 'too senior' for a role you were specifically headhunted for." },
  58: { tone:'neg',     text:"The interview runs forty minutes over. Nobody apologises." },
  59: { tone:'neg',     text:"You're asked to provide three references before a single offer has been discussed." },
  60: { tone:'neg',     text:"A recruiter calls to say the client wants to move fast. Three weeks pass. Nothing moves." },
  62: { tone:'neg',     text:"You're told you're the strongest candidate. So was, apparently, someone else." },
  63: { tone:'neg',     text:"The final interview is with someone who wasn't on the original panel and hasn't read your CV." }
};

