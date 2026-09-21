const COLS = 8, ROWS = 8, TOTAL = COLS*ROWS;

// classic boustrophedon numbering: row 0 = bottom row, squares 1-8 left-to-right
function squareNumber(row, col){
  if(row % 2 === 0) return row*COLS + col + 1;
  return row*COLS + (COLS - col);
}

// The job market is brutal at the moment, so snakes heavily outnumber ladders.
// ladders: start -> end (forward, good news)
const LADDERS = { 4:14, 20:38, 40:59, 51:62 };
// snakes: start -> end (backward, bad news)
const SNAKES = { 9:3, 17:2, 24:10, 28:16, 33:6, 42:21, 46:25, 53:32, 56:13, 61:19 };

// Community Chest squares: land here and draw a random hiring-event card.
const CHEST_SQUARES = [7, 15, 26, 37, 49, 58];

// Decision-point squares: land here and choose between two options.
const CHOICE_SQUARES = {
  12: {
    prompt: "A recruiter offers you a 'quick task' before the first interview — a 90-minute take-home exercise, unpaid, due tomorrow morning.",
    optionA: { label: "Do it tonight", delta: -1, text: "You do it tonight. It takes three hours, not ninety minutes, and you never hear what they thought of it." },
    optionB: { label: "Decline politely", delta: 1, text: "You decline politely and explain you're happy to discuss your experience instead. They respect it, and move you to interview anyway." }
  },
  23: {
    prompt: "The recruiter goes quiet after a genuinely great first call. Radio silence for four days.",
    optionA: { label: "Send a polite follow-up", delta: 1, text: "You send a short, polite follow-up. They reply within the hour with an apology and a next step." },
    optionB: { label: "Wait and see", delta: -2, text: "You wait and see. You are still waiting. You will always be waiting." }
  },
  35: {
    prompt: "A recruiter is unusually enthusiastic and asks you to 'hop on a call in the next ten minutes'.",
    optionA: { label: "Take the call now", delta: 2, text: "You take the call. It's genuine, they're good at their job, and it's a great conversation." },
    optionB: { label: "Ask to reschedule", delta: -1, text: "You ask to reschedule for tomorrow. The urgency evaporates and so, eventually, do they." }
  },
  50: {
    prompt: "The company that ghosted you two months ago has just reposted the exact same role.",
    optionA: { label: "Apply again anyway", delta: 2, text: "You apply again, dignity aside. This time, for reasons nobody will ever explain, it lands." },
    optionB: { label: "Block and move on", delta: 1, text: "You block them and move on. It feels fantastic. You put the energy into a better application elsewhere." }
  }
};

// Random hiring-event cards, drawn when a Community Chest square is landed on.
// Effects are deliberately small: +/- 1 or 2 squares.
const CHEST_DECK = [
  { text: "A recruiter you spoke to six months ago messages out of the blue: 'Are you still looking?'", delta: 2 },
  { text: "Your CV gets forwarded internally without your knowledge. Someone likes it.", delta: 1 },
  { text: "The company you applied to announces a hiring freeze the same week.", delta: -2 },
  { text: "A connection tags you in a 'we're hiring' post. Forty other people reply first.", delta: -1 },
  { text: "You get added to three more recruiter WhatsApp groups you never asked to join.", delta: -1 },
  { text: "An old manager messages: 'We've got a role open, thought of you immediately.'", delta: 2 },
  { text: "The job spec you spent all evening tailoring your CV for gets pulled the next day.", delta: -2 },
  { text: "A recruiter actually reads your covering letter, and mentions it.", delta: 1 },
  { text: "LinkedIn's algorithm randomly boosts your 'open to work' post to the right people.", delta: 1 },
  { text: "Your interview slot gets double-booked with someone else's. You're the one who moves.", delta: -1 }
];

const LADDER_TEXT = {
  4: "CV passes the initial screen. A human, allegedly, looked at it.",
  20: "You're invited to a first-stage interview. It's on Teams. It's fine.",
  40: "You clear the technical round. The 'technical round' was a chat about culture fit.",
  51: "Verbal offer given over the phone. You are told 'don't quote me on the number yet'."
};
const SNAKE_TEXT = {
  9:  "You get a call two minutes after applying. It's a scam job offer, and they'd like your bank details 'for onboarding'.",
  17: "ATS auto-rejects you 4 seconds after submission. It did not enjoy your 25 years of experience.",
  24: "Recruiter goes dark. LinkedIn shows they left the agency three weeks ago.",
  28: "The interviewer's camera stays off for the whole call. Yours, of course, was mandatory.",
  33: "Salary wasn't listed. You gave a number. You never hear from them again.",
  42: "'We've decided to go in a different direction.' Direction: unspecified, forever.",
  46: "A recruiter says the client wants 'someone more senior, for the same salary'.",
  53: "Three rounds in, they introduce a surprise fourth round: 'just a formality'. It is not a formality.",
  56: "Final interview. Told you're 'overqualified', which you suspect means 'too expensive'.",
  61: "The role is quietly reopened as 'urgent' the day after rejecting you."
};

// Every non-special square has its own fixed line and tone: pos, neg, twist (absurd), or neutral.
const SQUARE_TEXT = {
  1:  { tone:'neutral', text:"No jobs today. Better luck tomorrow." },
  2:  { tone:'pos',     text:"Congratulations, you get to apply for a role today." },
  3:  { tone:'neg',     text:"A recruiter pings you on LinkedIn about an 'opportunity'. Turns out they just want the names of hiring managers where you currently work." },
  5:  { tone:'neutral', text:"You spend the evening tailoring your CV to match keywords in a job spec that closes in six hours." },
  6:  { tone:'neg',     text:"A recruiter asks for your 'current package' before telling you anything about the role." },
  8:  { tone:'neutral', text:"An old colleague forwards you a job ad 'just in case'. It's not in case of anything relevant." },
  10: { tone:'neg',     text:"You spend an hour filling in an application form that asks for information already on your attached CV." },
  11: { tone:'neutral', text:"A recruiter calls just to 'touch base'. Nothing has changed since last time. Nothing will." },
  13: { tone:'neg',     text:"The application portal crashes halfway through. You start again from page one." },
  14: { tone:'pos',     text:"A friend who works at the company puts in a good word for you." },
  16: { tone:'neg',     text:"You spend Saturday morning prepping for an interview that gets rescheduled by email at 8:58am Monday." },
  18: { tone:'neutral', text:"You're added to a recruiter's 'talent pool'. You are never removed, contacted, or told what this means." },
  19: { tone:'neutral', text:"A job spec lists 'salary: competitive'. You apply anyway, hoping." },
  21: { tone:'neutral', text:"You get invited to a networking event. Everyone there is also job hunting." },
  22: { tone:'pos',     text:"Someone on your former team recommends you internally at their new company." },
  25: { tone:'neg',     text:"You spend twenty minutes writing a cover letter for a portal with no cover letter field." },
  27: { tone:'neg',     text:"You get a LinkedIn message: 'Loved your profile, are you open to new opportunities?' It's for a role two levels junior." },
  29: { tone:'neutral', text:"You spot a typo in your own CV. It has been there for three months." },
  30: { tone:'neg',     text:"A recruiter sends you a role you already turned down in March. They don't remember." },
  31: { tone:'twist',   text:"You practice interview answers out loud in the car. A passer-by gives you a concerned look." },
  32: { tone:'neutral', text:"You get a genuinely thoughtful rejection email, with feedback. This is rarer than the job itself." },
  34: { tone:'neg',     text:"You spend the weekend building a portfolio piece nobody asked for and nobody will see." },
  36: { tone:'neg',     text:"You're invited to a 'quick chat', which turns out to be a fully structured 90-minute interview." },
  38: { tone:'neg',     text:"You're told the hiring manager 'really liked' you. The role is put on hold the next day." },
  39: { tone:'neutral', text:"You update your notice period on every job board simultaneously, then immediately regret it." },
  41: { tone:'neg',     text:"A recruiter asks if you can 'do a quick task' before the first interview. The task takes four hours." },
  43: { tone:'neg',     text:"Someone claiming to be a 'talent partner' messages you. Their calendar link expires in nine minutes." },
  44: { tone:'twist',   text:"You're asked to complete a personality test. The results suggest you should be a florist." },
  45: { tone:'pos',     text:"You turn down a role because the salary band, once it finally appears, is insulting." },
  47: { tone:'neg',     text:"You're told the process will take 'two weeks, max'. It takes eleven." },
  48: { tone:'neutral', text:"You get offered an interview slot at 7am. You take it anyway." },
  52: { tone:'neutral', text:"You're asked in an interview where you see yourself in five years. You do not say 'not doing this again'." },
  54: { tone:'neg',     text:"You're told there's 'no news yet', for the fourth week running." },
  55: { tone:'pos',     text:"A recruiter you liked working with reaches out about a completely different, better-fitting role." },
  57: { tone:'neg',     text:"You get feedback that you were 'too senior' for a role you were specifically headhunted for." },
  59: { tone:'neg',     text:"You're asked to provide three references before a single offer has been discussed." },
  60: { tone:'neg',     text:"A recruiter calls to say the client wants to move fast. Three weeks pass. Nothing moves." },
  62: { tone:'neg',     text:"You're told you're the strongest candidate. So was, apparently, someone else." },
  63: { tone:'neg',     text:"The final interview is with someone who wasn't on the original panel and hasn't read your CV." }
};

// Roles you can pick before starting. A handful of squares get a role-flavoured line.
const ROLES = [
  { id:'tester',    label:'Tester',              icon:'🧪' },
  { id:'developer', label:'Developer',           icon:'💻' },
  { id:'ba',        label:'Business Analyst',    icon:'📊' },
  { id:'pm',        label:'Project Manager',     icon:'📋' },
  { id:'cto',       label:'CTO',                 icon:'🧭' }
];

const ROLE_FLAVOUR = {
  2: {
    tester:    "Congratulations — you get to apply for a Test Lead role that also expects you to write all the test cases first, unpaid, before interview.",
    developer: "Congratulations — you get to apply for a 'Senior Developer' role listing fourteen frameworks as 'essential'.",
    ba:        "Congratulations — you get to apply for a BA role where the spec is actually a Product Manager's job with a different title.",
    pm:        "Congratulations — you get to apply for a PM role that wants 'strong technical delivery skills' and no budget.",
    cto:       "Congratulations — you get to apply for a CTO role at a five-person startup with a 90-day probation."
  },
  11: {
    tester:    "A recruiter calls to 'touch base' about the QA role. It closed last week. Nobody told you.",
    developer: "A recruiter calls to 'touch base'. They can't recall which stack the role actually uses.",
    ba:        "A recruiter calls to 'touch base' about the BA role, then asks if you also 'do a bit of PM work'.",
    pm:        "A recruiter calls to 'touch base' and asks for your day rate before your name.",
    cto:       "A recruiter calls to 'touch base' about a CTO role that, it turns out, reports to a Head of Engineering."
  },
  39: {
    tester:    "You mark yourself 'immediately available' on every testing board you're registered with. Every recruiter in the country notices at once.",
    developer: "You update your GitHub profile to 'open to work'. Three recruiters DM you the same expired contract role.",
    ba:        "You update your notice period everywhere. A recruiter messages asking if you're 'more technical or more stakeholder-facing'.",
    pm:        "You update your availability. A recruiter asks if you're 'Agile or Waterfall', as if that's still the question.",
    cto:       "You quietly update your notice period. Your current CEO sees it within the hour."
  },
  60: {
    tester:    "A recruiter calls to say the client wants to move fast on the Test Manager role. Three weeks pass. Nothing moves.",
    developer: "A recruiter calls to say the client wants to move fast on the dev role. They're still 'finalising the tech test'.",
    ba:        "A recruiter calls to say the client wants to move fast. The client hasn't finished writing the requirements.",
    pm:        "A recruiter calls to say the client wants to move fast. The client hasn't agreed the budget internally yet.",
    cto:       "A recruiter calls to say the board wants to move fast on the CTO hire. The board hasn't met yet."
  }
};
