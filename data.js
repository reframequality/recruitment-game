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
// Each option can move you (delta), change your morale, or be a gamble:
// { chance, win:{...}, lose:{...} } resolved by a coin-flip of fate.
const CHOICE_SQUARES = {
  12: {
    prompt: "A recruiter offers you a 'quick task' before the first interview — a 90-minute take-home exercise, unpaid, due tomorrow morning.",
    optionA: { label: "Do it tonight", delta: -1, morale: -10, text: "You do it tonight. It takes three hours, not ninety minutes, and you never hear what they thought of it." },
    optionB: { label: "Decline politely", delta: 1, morale: 5, text: "You decline politely and explain you're happy to discuss your experience instead. They respect it, and move you to interview anyway." }
  },
  23: {
    prompt: "The recruiter goes quiet after a genuinely great first call. Radio silence for four days.",
    optionA: { label: "Send a polite follow-up", delta: 1, morale: 5, text: "You send a short, polite follow-up. They reply within the hour with an apology and a next step." },
    optionB: { label: "Wait and see", delta: -2, morale: -10, text: "You wait and see. You are still waiting. You will always be waiting." }
  },
  29: {
    prompt: "You spot a typo in the CV you sent this morning. It's in the phrase 'meticulous attention to detail'.",
    optionA: { label: "Send a corrected copy", delta: 1, morale: 5, text: "You send a corrected copy with a self-deprecating note. The recruiter replies 'haha no worries'. A human! A real one!" },
    optionB: { label: "Say nothing and hope", gamble: {
      chance: 0.5,
      win:  { delta: 2, morale: 5,   text: "You say nothing. Nobody notices. Nobody, it turns out, reads CVs." },
      lose: { delta: -2, morale: -10, text: "You say nothing. The hiring manager noticed. They mention it in the interview. Twice." }
    } }
  },
  35: {
    prompt: "A recruiter is unusually enthusiastic and asks you to 'hop on a call in the next ten minutes'.",
    optionA: { label: "Take the call now", delta: 2, morale: 10, text: "You take the call. It's genuine, they're good at their job, and it's a great conversation." },
    optionB: { label: "Ask to reschedule", delta: -1, morale: -5, text: "You ask to reschedule for tomorrow. The urgency evaporates and so, eventually, do they." }
  },
  44: {
    prompt: "Before anyone will speak to you, you're asked to complete a 120-question personality test.",
    optionA: { label: "Answer honestly", gamble: {
      chance: 0.5,
      win:  { delta: 3, morale: 10,  text: "You answer honestly. The results call you a 'Visionary Collaborator'. HR is thrilled and fast-tracks you." },
      lose: { delta: -3, morale: -10, text: "You answer honestly. The results suggest you should be a florist. HR forwards your details to a florist." }
    } },
    optionB: { label: "Answer in buzzwords", delta: 1, morale: -10, text: "You answer as a 'self-starting, synergy-driven team player'. The algorithm loves you. You feel nothing." }
  },
  50: {
    prompt: "The company that ghosted you two months ago has just reposted the exact same role.",
    optionA: { label: "Apply again anyway", delta: 2, morale: -5, text: "You apply again, dignity aside. This time, for reasons nobody will ever explain, it lands." },
    optionB: { label: "Block and move on", delta: 1, morale: 15, text: "You block them and move on. It feels fantastic. You put the energy into a better application elsewhere." }
  }
};

// Random hiring-event cards, drawn when a Community Chest square is landed on.
// delta moves you, rival moves the internal candidate, morale changes your
// morale, grant hands you an extra power-up charge.
const CHEST_DECK = [
  { text: "A recruiter you spoke to six months ago messages out of the blue: 'Are you still looking?'", delta: 2 },
  { text: "Your CV gets forwarded internally without your knowledge. Someone likes it.", delta: 1 },
  { text: "The company you applied to announces a hiring freeze the same week.", delta: -2 },
  { text: "A connection tags you in a 'we're hiring' post. Forty other people reply first.", delta: -1 },
  { text: "You get added to three more recruiter WhatsApp groups you never asked to join.", delta: -1, morale: -5 },
  { text: "An old manager messages: 'We've got a role open, thought of you immediately.'", delta: 2 },
  { text: "The job spec you spent all evening tailoring your CV for gets pulled the next day.", delta: -2 },
  { text: "A recruiter actually reads your covering letter, and mentions it.", delta: 1, morale: 5 },
  { text: "LinkedIn's algorithm randomly boosts your 'open to work' post to the right people.", delta: 1 },
  { text: "Your interview slot gets double-booked with someone else's. You're the one who moves.", delta: -1 },
  { text: "The internal candidate posts 'Excited to announce my next chapter…' — at a different company!", rival: -5 },
  { text: "The internal candidate's manager champions them in a meeting you weren't invited to.", rival: 4 },
  { text: "The internal candidate is on a two-week holiday with no signal. Bliss.", rival: -3 },
  { text: "A mentor buys you a coffee and rips your CV apart, kindly. +1 'Tailor your CV'.", grant: 'tailor', morale: 5 },
  { text: "You bump into an old colleague at a meetup who 'knows someone'. +1 'Use your network'.", grant: 'network' },
  { text: "You finally learn the hiring manager's actual name. +1 'Follow up politely'.", grant: 'followUp' },
  { text: "Your dog is delighted to see you, regardless of your employment status.", morale: 20 },
  { text: "Someone you admire likes your LinkedIn post. Just a like. You think about it all day.", morale: 10 },
  { text: "A 'Congrats on your new role!' notification arrives. It's for your ex-colleague.", morale: -10 }
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
  30: { tone:'neg',     text:"A recruiter sends you a role you already turned down in March. They don't remember." },
  31: { tone:'twist',   text:"You practice interview answers out loud in the car. A passer-by gives you a concerned look." },
  32: { tone:'neutral', text:"You get a genuinely thoughtful rejection email, with feedback. This is rarer than the job itself." },
  34: { tone:'neg',     text:"You spend the weekend building a portfolio piece nobody asked for and nobody will see." },
  36: { tone:'neg',     text:"You're invited to a 'quick chat', which turns out to be a fully structured 90-minute interview." },
  38: { tone:'neg',     text:"You're told the hiring manager 'really liked' you. The role is put on hold the next day." },
  39: { tone:'neutral', text:"You update your notice period on every job board simultaneously, then immediately regret it." },
  41: { tone:'neg',     text:"A recruiter asks if you can 'do a quick task' before the first interview. The task takes four hours." },
  43: { tone:'neg',     text:"Someone claiming to be a 'talent partner' messages you. Their calendar link expires in nine minutes." },
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
// salary is the opening offer (in £k) when you reach the final negotiation.
const ROLES = [
  { id:'tester',    label:'Tester',              icon:'🧪', salary:48 },
  { id:'developer', label:'Developer',           icon:'💻', salary:58 },
  { id:'ba',        label:'Business Analyst',    icon:'📊', salary:52 },
  { id:'pm',        label:'Project Manager',     icon:'📋', salary:56 },
  { id:'cto',       label:'CTO',                 icon:'🧭', salary:115 }
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

// A few squares have alternate lines, picked at random, so repeat plays stay fresh.
const ALT_TEXT = {
  1:  ["No jobs today. Better luck tomorrow.", "You refresh the job boards. Then refresh them again. Same seven roles as yesterday."],
  5:  ["You spend the evening tailoring your CV to match keywords in a job spec that closes in six hours.", "You rewrite your LinkedIn headline for the fourth time this month. It now contains the word 'passionate'."],
  13: ["The application portal crashes halfway through. You start again from page one.", "The portal asks you to create an account. You already have one. It has forgotten you."],
  21: ["You get invited to a networking event. Everyone there is also job hunting.", "You attend a webinar on 'thriving in today's job market'. The host is also job hunting."],
  48: ["You get offered an interview slot at 7am. You take it anyway.", "You're offered an interview slot during your current job's all-hands. You take it from a car park."],
  54: ["You're told there's 'no news yet', for the fourth week running.", "You chase for an update. 'We'll be in touch either way.' They will not be in touch either way."]
};

// The run's random market conditions, drawn at the start of every job hunt so
// repeat plays differ. Extra snakes/ladders are added to the board for that run.
const MARKETS = [
  { id:'steady',   icon:'📈', name:'Steady market',           text:"Nothing unusual is happening. Which, in this market, is itself unusual." },
  { id:'ai',       icon:'🤖', name:'AI screening everywhere', text:"Every portal now has an AI screener. Two extra snakes slither onto the board.", snakes:{ 19:5, 36:22 },
    snakeText:{ 19:"An AI screener rejects you for 'low enthusiasm', detected from your choice of font.", 36:"An AI interviewer asks you to 'describe a time you showed resilience', then crashes mid-answer." } },
  { id:'boom',     icon:'🚀', name:'Funding boom',            text:"A wave of funding rounds lands. Two extra ladders appear on the board.", ladders:{ 10:27, 31:45 },
    ladderText:{ 10:"A freshly funded startup slides into your DMs: 'We move fast. Can you start Monday?'", 31:"A Series B scale-up skips the take-home test entirely. Nobody can quite believe it." } },
  { id:'freeze',   icon:'🧊', name:'Hiring freeze',           text:"Budgets are frozen. The internal candidate moves slower, but every knock hits your morale 50% harder.", rivalMax:4, moraleLoss:1.5 },
  { id:'nepotism', icon:'👨‍👦', name:"The CEO's nephew applied", text:"The internal candidate starts six squares ahead of you. Nobody will say why.", rivalStart:7 },
  { id:'bonanza',  icon:'📞', name:'Recruiter bonanza',       text:"Recruiters are everywhere. Community Chest effects are doubled — good and bad.", chestMult:2 },
  { id:'yearend',  icon:'💷', name:'Year-end budget flush',   text:"Use-it-or-lose-it budget. You never roll a 1. The internal candidate never did anyway.", minRoll:2 }
];

// The internal candidate moves min-max squares every week (a market can lower
// max), and an event from RIVAL_EVENTS fires with eventChance.
const RIVAL = { min:2, max:5, eventChance:0.12 };

// Things that happen to the internal candidate now and then.
const RIVAL_EVENTS = [
  { text:"The internal candidate's reference check stalls. Their old boss is on sabbatical.", delta:-4 },
  { text:"The internal candidate forgets to turn up to their own interview.", delta:-3 },
  { text:"The internal candidate plays five-a-side with the hiring manager. Every Thursday.", delta:3 },
  { text:"The internal candidate's 'stretch project' gets a shout-out at the all-hands.", delta:4 },
  { text:"The other external candidate drops out. The internal candidate is now 'the obvious choice'.", delta:3 },
  { text:"The hiring manager describes the internal candidate as 'a known quantity'. It is meant as a compliment.", delta:2 }
];

// Final offer negotiation: a push-your-luck mini-game on reaching the last square.
// Each push adds raisePct of the opening offer, at the listed risk of the offer
// being rescinded. Good morale shaves the risk; low morale adds to it.
const NEGOTIATION = {
  raisePct: 0.08,
  risks: [0.15, 0.30, 0.45, 0.60],
  rescindTo: 47,
  pushLines: [
    "They say they'll 'go back to the budget holder'. Two agonising days later, they do.",
    "They sigh audibly, but the number moves.",
    "'That's really the top of the band.' The band, it turns out, has a secret top.",
    "Silence on the line for eleven seconds. Then: 'Let me see what I can do.'"
  ],
  rescindLines: [
    "The offer is withdrawn. They've 'decided to pause the role'. It's reposted on LinkedIn by Friday.",
    "The offer is rescinded. 'We were looking for someone more aligned with the band.'",
    "The budget holder says no. To the raise, and also to you."
  ]
};

// An accepted offer isn't a job until you start. After accepting, there is a
// `chance` that something pulls it anyway, which ends the run. Tuned with the
// rival speed so that roughly one job hunt in ten ends in a hire.
const OFFER_FATE = {
  chance: 0.8,
  pulled: [
    { stamp:'BUDGET PULLED',  text:"Finance has pulled the budget for the role. The role was 'never formally approved'. Nobody can say who approved the interviews." },
    { stamp:'ON HOLD',        text:"The company announces an Operating Model Review. All onboarding is suspended pending the review. The review has no end date." },
    { stamp:'OVERQUALIFIED',  text:"After flying through every interview, you're told you're 'overqualified'. They're worried you'd get bored. You are now bored." },
    { stamp:'AI ONLY',        text:"The CEO has decided all new hires will be AI agents. No humans, effective immediately. The agent starts Monday. It has your desk." },
    { stamp:'REORG',          text:"A reorg lands the day before your start date. Your hiring manager now reports to someone who 'doesn't see the need for the role'." },
    { stamp:'HEADCOUNT FROZEN', text:"Headcount has been moved to 'next financial year'. They'll 'definitely be in touch in April'. Which April is not specified." },
    { stamp:'OFFSHORED',      text:"The role has been moved offshore to save costs. They ask if you'd be happy to help with the handover. Unpaid." },
    { stamp:'MANAGER LEFT',   text:"Your hiring manager has resigned. Their replacement wants to 'revisit all open requisitions'. Yours is open no longer." },
    { stamp:'NEW CTO',        text:"A new CTO starts and freezes all hiring 'until the tech strategy is clear'. The tech strategy will never be clear." },
    { stamp:'CHANGED MIND',   text:"The internal candidate 'reconsidered' and now wants the role after all. They get it. Of course they get it." }
  ],
  survive: [
    "Finance tried to pull the budget, but someone had already sent the contract. HR couldn't work out how to un-send it.",
    "The Operating Model Review was postponed by an Operating Model Review. Your start date stands.",
    "The CEO's AI-only memo arrives one day after your contract is signed. You are, legally, too late to replace."
  ]
};

// Trophy cabinet. Unlocked badges persist in the browser across runs.
const ACHIEVEMENTS = [
  { id:'hired',     icon:'💼', name:'Gainfully employed', desc:'Get the job.' },
  { id:'speedrun',  icon:'⚡', name:'Speedrun',           desc:'Get the job in 14 weeks or fewer.' },
  { id:'shark',     icon:'🦈', name:'Shark',              desc:'Push for more three times and keep the offer.' },
  { id:'greedy',    icon:'💸', name:'Greed is not good',  desc:'Have an offer rescinded.' },
  { id:'thickskin', icon:'🐍', name:'Thick skin',         desc:'Get bitten by five snakes in one search.' },
  { id:'burnout',   icon:'🫠', name:'Running on empty',   desc:'Hit burnout.' },
  { id:'purist',    icon:'🧘', name:'Purist',             desc:'Get the job without using a single power-up.' },
  { id:'photo',     icon:'📸', name:'Photo finish',       desc:'Get the job with the internal candidate within 6 squares of the end.' },
  { id:'nepotism',  icon:'👔', name:'Internal candidate', desc:'Lose the role to the internal candidate.' },
  { id:'daily',     icon:'📅', name:'Daily grind',        desc:'Finish a daily challenge.' },
  { id:'polymath',  icon:'🎓', name:'Polymath',           desc:'Get the job with every role.' },
  { id:'pulled',    icon:'🪦', name:'So close',           desc:'Accept an offer, then have it pulled before you start.' }
];
