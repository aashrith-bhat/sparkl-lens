export const task1Stats = [
  {
    value: "27.1%",
    label: "of Std III children in rural India could read a Std II-level text",
    detail: "Which means about 72.9% could not meet that specific benchmark. A rural household-survey estimate, not every child in India.",
    source: "ASER 2024",
    lead: true,
  },
  {
    value: "23.4%",
    label: "of Std III children in rural government schools read a Std II text",
    detail: "Up from 16.3% in 2022.",
    source: "ASER 2024",
  },
  {
    value: "33.7%",
    label: "of Std III children could solve at least a basic subtraction problem",
    detail: "The corresponding share was 25.9% in 2022.",
    source: "ASER 2024",
  },
  {
    value: "23%",
    label: "of Std III government-school students in Karnataka could do subtraction",
    detail: "The reported figure for private-school students was 31%.",
    source: "Indian Express reporting ASER 2024",
  },
  {
    value: "19%",
    label: "of government-school Std V students in Karnataka could do division",
    detail: "35% of Std VIII students could. Private-school figures were 25% and 43%.",
    source: "Indian Express reporting ASER 2024",
  },
  {
    value: "86,000",
    label: "Grade III students took part in the 2022 Foundational Learning Study",
    detail: "Across 10,000 schools and 20 languages, including Kannada.",
    source: "PARAKH / NCERT",
  },
];

export const problemFacts = [
  "A child can attend a higher grade than the reading or arithmetic they can currently use. Judging only by school grade hides that gap.",
  "ASER tests children aged 5–16 with the same progressive tool, whatever their age or grade. The recorded result is the highest level the child can comfortably reach.",
  "The reading ladder moves from letters to familiar words, a connected paragraph and a short Grade II-level story. Arithmetic moves from number recognition to subtraction and 3-digit-by-1-digit division.",
  "SparkL already assesses children in Kannada, English and Maths and uses the results to guide learning, but assessment, grading and progress tracking are largely manual.",
  "Adult listening is essential at three points: hearing the child read, judging accuracy and comfort, and recording or confirming the level. A digital tool can reduce recording work, but should not silently replace educator judgement.",
  "Offline-first Android guidance says core work can run without a network when there is a local data source. Local saving and later sync are separate responsibilities.",
  "Offline speech recognition is more demanding than offline records: memory, processor speed, model size, noise and children's pronunciation all affect accuracy. The team has not supplied the actual device, so this is an open question to test.",
];

export const kannadaComplexity = [
  { form: "ಅ", type: "Vowels", detail: "Independent vowel forms." },
  { form: "ಕ", type: "Consonants with an inherent vowel", detail: "The consonant carries an unwritten 'a'." },
  { form: "ಕಾ", type: "Consonants with vowel signs", detail: "Matras or diacritics change the vowel." },
  { form: "ಕ್ಷ", type: "Conjunct / cluster forms", detail: "Two or more consonants combine into one akshara." },
];

export const stakeholders = [
  {
    group: "Children",
    interest: "Fair, age-appropriate assessment and useful learning support.",
    question: "Do they understand instructions? What makes them anxious or comfortable?",
  },
  {
    group: "Educators / assessors",
    interest: "Run assessment, judge responses, record levels and plan lessons.",
    question: "Which steps take longest? What judgement calls are difficult?",
  },
  {
    group: "SparkL programme lead",
    interest: "Owns the assessment method, grading rules and programme quality.",
    question: "What is the official rubric? What must never change?",
  },
  {
    group: "Centre coordinators",
    interest: "Schedule sessions, manage shared devices and records.",
    question: "How many children per session or device? What connectivity exists?",
  },
  {
    group: "Parents / guardians",
    interest: "Child welfare, consent and appropriate use of data.",
    question: "Who can authorise participation and data processing?",
  },
  {
    group: "Schools / teachers",
    interest: "May provide grade and context information and coordinate support.",
    question: "How are SparkL levels used alongside school records?",
  },
  {
    group: "Project team / developers",
    interest: "Translate the current workflow into an offline tool and test it.",
    question: "What minimum device and security requirements apply?",
  },
  {
    group: "Funders / partners",
    interest: "May support scaling and expect evidence of impact.",
    question: "What outcomes and reporting evidence do they require?",
  },
];

export const interviewQuestions = [
  "How do you recognise what a child understands beyond their school grade or examination marks?",
  "What differences have you noticed between a child's ability in one subject and another?",
  "How do children respond when a concept is difficult or unfamiliar?",
  "Which learning activities appear to engage children most, and why?",
  "How would you identify the point at which a child's understanding begins to break down?",
  "What language or communication barriers have you encountered while working with children?",
  "What needs to be in place before a school or learning programme introduces digital tools?",
  "What role should teachers or facilitators continue to play when digital tools are used?",
  "What practical difficulties have your projects faced in terms of time, money, devices, staffing or parental trust?",
  "How have you addressed those difficulties, and what resources or support were required?",
  "How do you know whether a child's learning has improved over time?",
  "What should a project like SparkL avoid when designing a digital assessment system?",
];

export const interviews = [
  {
    name: "Rtr. Neeraj R",
    role: "President, Rotaract Bangalore West",
    date: "22 Oct 2026",
    format: "Online",
    team: "Aashrith Bhat, Sufiyan Ahmed",
    shared:
      "Children often understand better through hands-on activity. Some lose focus when a topic becomes difficult, and unfamiliar technical words make it harder to follow. He described computer sessions at Walniki Shala in Nagarhole, where many children studied only to Grade 7. Some children prefer learning alone; others do better in groups.",
  },
  {
    name: "Rtr. Chinmayee S",
    role: "Community Service Director, Rotaract Bangalore West",
    date: "22 Oct 2026",
    format: "Online",
    team: "Aashrith Bhat, Sufiyan Ahmed",
    shared:
      "Vidyadhan supports more than 60 underprivileged students each year. Keeping students motivated and making sure scholarship money reaches college accounts are two challenges. Exam marks do not always show what a student can do in practice; she supported more hands-on learning and chances to explore interests.",
  },
  {
    name: "Rtr. Gargee Mitra",
    role: "Club Service Director, Rotaract Bangalore West",
    date: "22 Oct 2026",
    format: "Online",
    team: "Aashrith Bhat, Sufiyan Ahmed",
    shared:
      "Assess children in stages: begin with simple skills such as letters and phonetics, then words and sentences, and notice where the child starts struggling. A child can have different strengths across subjects. AI could be a limited support for spotting gaps, but should not replace teaching or the teacher–child connection.",
  },
  {
    name: "Rtr. Sansita Rao",
    role: "Sergeant At Arms, Rotaract Bangalore West",
    date: "22 Oct 2026",
    format: "Online",
    team: "Aashrith Bhat",
    shared:
      "Schools and teachers need to be prepared before digital learning is introduced. Some remote communities lack facilities and trained educators; foundational education and teacher training should come first. Digital tools can help in balance, but teachers should check the information and results. She cautioned against over-dependence on AI or calculators.",
  },
  {
    name: "Rtr. Shankar",
    role: "Immediate Past President, Rotaract Bangalore West; Zonal Rotaract Representative",
    date: "24 Oct 2026",
    format: "Online",
    team: "Aashrith Bhat, Hajira Noorain, Vismay G",
    shared:
      "Exam-focused grading can miss practical knowledge and different strengths. Digital-literacy funding is hard: the team approached around 15–20 companies for CSR support. At the Nagar digital-literacy lab, many children were more comfortable speaking Kannada and a local tribal language than English, so training used a structured computer and language syllabus and local staff. The team spent about one to one-and-a-half months building parents' trust before a 3-day educational trip for around 250 government-school students.",
  },
  {
    name: "Khamar Ara Banu",
    role: "ICT, Computer Science and IT Mentor; B.Sc. Computer Science, B.Ed., MCA; 16 years' teaching",
    date: "29 Oct 2026",
    format: "Onsite",
    team: "Aashrith, Hajira, Vismay, Sufiyan",
    shared:
      "Khamar teaches Computer Science and IT up to Grade 12 and is a research scholar at MIT, MAHE, Bengaluru. She put student privacy first: do not store personal student data, and consider privacy from the start. She encouraged the team to explore vibecoding, and to finalise the target area, partner school or institution, and education board (CBSE, ICSE or State Board).",
  },
];

export const lessons = [
  {
    title: "A grade does not describe every subject",
    body: "Gargee and Shankar both described children who were comfortable in one subject but struggling in another. Assess Kannada, English and Maths separately instead of giving one overall learning level.",
  },
  {
    title: "Find where understanding breaks, not only right or wrong",
    body: "Start with simple skills and move up until the child begins to struggle. In English, that could run from letter recognition to phonetics, words and sentences.",
  },
  {
    title: "Support the teacher, do not replace them",
    body: "AI might help a teacher spot a learning gap, but teachers should remain responsible for checking results and deciding what happens next.",
  },
  {
    title: "Language and facilities matter as much as the technology",
    body: "At Nagar, many children were more comfortable in Kannada or a local tribal language. Remote schools may need basic facilities and trained teachers before new digital tools.",
  },
  {
    title: "A good idea still has to work in practice",
    body: "Funding, student motivation and parents' trust were real constraints. The team approached 15–20 companies for CSR support and spent weeks building trust before a trip.",
  },
];

export const changedViews = [
  {
    before: "The main challenge was to build a digital assessment tool.",
    now: "Teachers need to be comfortable using it, schools need the right facilities, and the system has to fit the language and circumstances of the children.",
  },
  {
    before: "Digitalisation and AI were part of the same solution.",
    now: "Digital tools can be useful without AI. A limited tool that helps teachers spot gaps may be more appropriate than automation.",
  },
  {
    before: "All children learn in the same way, at the same pace.",
    now: "Learning preferences and subject strengths differ; the assessment must account for that.",
  },
  {
    before: "English was the default interface.",
    now: "An English-only interface could make the assessment harder for reasons unrelated to understanding. Kannada and local-language instructions belong in the design from the start.",
  },
  {
    before: "Devices and software were the main requirement.",
    now: "Teacher training, basic schooling, parental trust, continued funding and student motivation are also essential to making the project work.",
  },
];

export const implications = [
  "Assess each subject separately, so a child can be at a different level in Kannada, English and Maths.",
  "Build the assessment step by step, from foundational skills upward, to see where the child is comfortable and where they begin to need help.",
  "Keep teachers involved: they should be able to run the assessment, understand the result and decide the next support.",
  "Plan for the language children are most comfortable using, including local-language instructions.",
  "Avoid collecting personal details that are not needed, and decide how necessary information is handled before starting.",
  "Finalise the location, partner school and education board before settling assessment content or technology.",
  "Look beyond setup cost: devices, internet, teacher training, maintenance and teacher time all count.",
];

export const tools = [
  {
    name: "ASER / Pratham",
    forWhom: "Assessors working with children across grades",
    what:
      "One-to-one progressive reading and arithmetic tool. Reading runs from letters to a Grade II story; arithmetic from number recognition to division. Records the highest level the child can comfortably reach. A Kannada tool exists.",
    cost: "Published tool; no per-child software fee listed. Printing and staff time remain.",
    maintained: "ASER Centre / Pratham ecosystem; local assessors administer it.",
    limits:
      "A human must listen to oral reading, judge accuracy and fluency and record the result. A strong assessment, not a full child-record or progress system.",
    kannada: "Yes",
    offline: "Yes, on paper",
    adult: "Essential",
  },
  {
    name: "Pratham TaRL",
    forWhom: "Children behind in foundational skills",
    what:
      "Assesses children, groups by demonstrated level rather than grade, teaches at that level, then reassesses and regroups.",
    cost: "Varies by programme and partner; no universal price. Staff, mentoring and materials required.",
    maintained: "Pratham, instructors, government partners and mentors.",
    limits:
      "A whole teaching method, not just an app. Depends on educator judgement, routines and ongoing support; digitisation should not remove those.",
    kannada: "Adapted locally",
    offline: "Yes, in person",
    adult: "Essential",
  },
  {
    name: "Google Read Along / Bolo",
    forWhom: "Children practising reading aloud",
    what:
      "Free Android reading app with a listening buddy, pronunciation support, encouragement, stories and multiple child profiles. Designed for low-cost phones and offline use after download.",
    cost: "Free.",
    maintained: "Google; an adult may help with setup and supervision.",
    limits:
      "The reviewed official language list did not include Kannada. It is reading practice, not SparkL's Kannada–English–Maths assessment and grading workflow.",
    kannada: "No (reviewed list)",
    offline: "After download",
    adult: "Setup / supervision",
  },
  {
    name: "Rocket Learning",
    forWhom: "Young children, caregivers and frontline workers",
    what:
      "Digital public-good and community approach supporting early learning through caregivers and frontline workers, with activity content and engagement.",
    cost: "No single public price for SparkL adoption found; likely partnership-dependent.",
    maintained: "Rocket Learning and government or implementation partners.",
    limits:
      "Public information does not confirm SparkL's exact Kannada rubric, maths ladder or offline assessment-record workflow. Adult or caregiver engagement is central.",
    kannada: "Unconfirmed",
    offline: "Unconfirmed",
    adult: "Central",
  },
  {
    name: "Chimple",
    forWhom: "Young learners building literacy",
    what:
      "Interactive literacy activities covering letters, phonics, word formation, sentences and quizzes; published help materials describe progress reports.",
    cost: "Publicly available app; no universal implementation price identified.",
    maintained: "Chimple team; adults may manage classes and reports.",
    limits:
      "Published curriculum identifies English and Hindi, not Kannada. Primarily a learning app, not a validated SparkL-style diagnostic across three subjects.",
    kannada: "No (published list)",
    offline: "Not confirmed",
    adult: "Reports",
  },
  {
    name: "Khan Academy Kids",
    forWhom: "Children about 2–8 and early educators",
    what:
      "Free literacy, language, maths, books and interactive activities. Classroom tools and reports exist; selected activities are available offline through Kodi's Suitcase after setup.",
    cost: "Free for families and individual teachers; school or district features listed at US$5 per student.",
    maintained: "Khan Academy; teachers and admins manage classroom features.",
    limits:
      "Not a direct replacement for SparkL's rubric and not documented as a Kannada-first diagnostic. Offline access to selected activities does not prove reports or sync work offline.",
    kannada: "Not documented",
    offline: "Selected activities",
    adult: "Interpretation",
  },
  {
    name: "Paper register / Excel",
    forWhom: "Tuition centres and small NGOs",
    what:
      "Records child, date, skill tested and result; a spreadsheet can calculate levels, filter records and show progress.",
    cost: "Paper has printing costs; a spreadsheet may be free or already licensed. Staff time is the main cost.",
    maintained: "Educator or centre coordinator.",
    limits:
      "Cheap, familiar and offline. Paper requires manual summaries; spreadsheets risk formula errors, duplicates, version conflicts and weak access control. This is the baseline a new app must outperform.",
    kannada: "Yes",
    offline: "Yes",
    adult: "Records",
  },
];

export const landscapeGaps = [
  {
    title: "No combined Kannada–English–Maths workflow",
    body: "The reviewed public options do not establish an off-the-shelf tool that applies SparkL's own rubric across all three subjects.",
  },
  {
    title: "Kannada is not first-class",
    body: "Read Along and Chimple's published language lists do not include Kannada; Khan Academy Kids is not documented as a Kannada diagnostic tool.",
  },
  {
    title: "Human judgement remains essential",
    body: "ASER oral reading needs an adult to listen and decide whether a level is comfortably achieved. Speech tools should not be final pass/fail authorities without validation.",
  },
  {
    title: "Assessment plus child history",
    body: "ASER is a measurement tool and TaRL a teaching approach. Neither alone supplies the proposed offline child history, subject levels, reassessment records and sync workflow.",
  },
  {
    title: "Offline records and safe sync",
    body: "Paper works offline but is hard to aggregate; online dashboards may need connectivity. Offline learning content does not prove records can be safely synced across shared devices.",
  },
  {
    title: "Field evidence and real costs",
    body: "Several products do not publish a universal NGO implementation price. Ask about licensing, onboarding, support, device requirements and recurring costs.",
  },
];

export const caseStudies = [
  {
    place: "Uttar Pradesh, India",
    what:
      "Pratham and the Government of Uttar Pradesh grouped Grades 3–5 children by learning level rather than grade, with intensive language and maths instruction during school hours.",
    result: "0.7–1.0",
    unit: "learning levels gained on average in 10- and 20-day camps",
    detail:
      "In the camp group, the share able to read a paragraph or story rose from 15% at baseline to 49% at endline; the control group rose from 15% to 24%.",
    caution:
      "Results from a specific evaluation; they should not be assumed to predict SparkL's impact.",
  },
  {
    place: "Madagascar",
    what:
      "A TaRL evaluation adapted targeted instruction to local schools, organising teaching around foundational literacy and numeracy rather than the grade-level curriculum alone.",
    result: "0.56 SD",
    unit: "improvement in Grade 3 mathematics",
    detail:
      "TaRL Africa's evidence summary reports a 0.56 standard-deviation improvement for Grade 3 students in the Madagascar evaluation.",
    caution:
      "The principle can transfer, but materials and routines must fit the local language and teaching practice.",
  },
];

export const solutions = [
  {
    id: "solution-1",
    status: "Version one",
    title: "Offline educator-led assessment",
    body:
      "An Android tool lets an educator select an anonymous learner code, move through SparkL-approved skill steps in Kannada, English or Maths, and record the demonstrated level. It saves locally and works without internet. The educator — not the app — confirms the result.",
    why:
      "From Gargee's staged-assessment suggestion, Shankar's language example and Task 3's finding that ASER still needs a human listener while paper works offline.",
    funding: "SparkL, an NGO or school partner, or a CSR sponsor. Willingness and budget are unconfirmed.",
  },
  {
    id: "solution-2",
    status: "Next",
    title: "Basic progress history",
    body:
      "A simple history view shows each anonymous learner's recorded level over time, separately by subject, with the date and skill assessed. It helps educators see what to revisit without relying only on grade or exam marks.",
    why:
      "From interview findings about subject-specific strengths and the gap between assessment tools and a complete reassessment record.",
    funding: "SparkL or a partner, subject to discussion.",
  },
  {
    id: "solution-3",
    status: "Experiment",
    title: "Kannada reading assistance",
    body:
      "Test whether a device can assist with a small set of Kannada reading tasks. An educator still listens and confirms the result; any automated suggestion is compared with educator judgement and stopped if unreliable.",
    why:
      "From the language concerns in Task 2 and the Kannada-first gap in Task 3. An experiment, not the basis of version one.",
    funding: "Needs SparkL educators and a technical or research partner; funding is not confirmed.",
  },
];

export const approachSteps = [
  {
    title: "Understand the current process",
    body:
      "Meet educators, observe an assessment, review the rubric and record sheet with identifying details hidden, and measure time spent on each step.",
  },
  {
    title: "Agree scope and rules",
    body:
      "Confirm target area, partner institution, board, subjects, Kannada skill sequence, pass rules and data that must not be stored.",
  },
  {
    title: "Sketch and review",
    body:
      "Make a paper prototype and ask an educator with no technical training to use it and explain the screens back.",
  },
  {
    title: "Build a small offline prototype",
    body:
      "Start with learner-code selection, assessment steps, educator-entered results, local saving and a simple subject-wise record. Leave AI and complex dashboards out.",
  },
  {
    title: "Test",
    body:
      "Compare results with SparkL-approved rules and anonymised records. Test airplane mode, weak connectivity, low battery, shared-device use, Kannada display and reopening saved results.",
  },
  {
    title: "Pilot",
    body:
      "With permission, test at one centre. Measure completion time, errors, ease of use and whether the tool adds work. Expand only if SparkL agrees it works.",
  },
];

export const hardQuestions = [
  {
    q: "How do we assess reading without an adult listening, and what accuracy is good enough?",
    a: "We do not yet know that automatic assessment is reliable enough for SparkL's children and languages. Version one should have an educator listen and confirm. A separate Kannada speech experiment can compare machine suggestions with educator judgement. SparkL and educators must agree a threshold before testing; until then, software should not decide a child's level.",
  },
  {
    q: "What happens if the internet is down and the tablet is at 8%?",
    a: "The core assessment works offline and saves locally. The educator can finish or save the current result, then charge the device; syncing waits for connectivity. This must be tested on the real device. If it cannot safely continue, use the existing paper sheet and enter it later.",
  },
  {
    q: "Which single part of the loop are we taking?",
    a: "Assessment: a teacher-led, subject-wise assessment that records demonstrated skills. A small record supports it, but version one is not a full teaching or learning-plan system.",
  },
  {
    q: "How does Kannada work as a first-class language?",
    a: "Kannada needs its own skill sequence and content, not English questions with Kannada labels. A Kannada educator and SparkL should approve the sequence, examples, instructions and pass rules. The team must test Kannada script display and usability on the actual device, and confirm whether another local language is needed.",
  },
];

export const successCriteria = [
  "An educator can complete and save an assessment offline and understand the result without technical help.",
  "Results are compared with the SparkL-approved rubric, and every mismatch is logged.",
  "Time and errors are compared with the current process.",
  "SparkL agrees pass thresholds before testing; no accuracy percentage is invented.",
  "Airplane mode, weak connectivity, low battery, shared-device use, Kannada display and reopening saved results are all tested on the real device.",
];

export const openQuestions = [
  "Can we observe one full assessment for Kannada, English and Maths, from selecting a child to recording the final level?",
  "What are the current assessment sheets, item lists, level names and pass/fail rules for each subject?",
  "For Kannada, what exact akshara, kagunita, word and passage sequence is used? Are there alternative forms for reassessment?",
  "What are the three most common judgement calls? How are borderline responses handled?",
  "How many children are assessed per day, week or month, at each centre, and how many minutes does each assessment plus recording take?",
  "Who calculates the skill grade today, using what rule or spreadsheet? Can the same child have different levels within a subject?",
  "How often are children reassessed, and what evidence counts as meaningful progress?",
  "What Android devices are available (model, Android version, RAM, free storage, battery health)? How many educators share each device?",
  "Where and how often is internet available? What should happen if the device is lost, damaged or used by a different educator?",
  "What child information is necessary, who can access it, where is it stored, and what consent and child-protection policy applies?",
  "Can SparkL provide anonymised historical records to compare app-calculated grades with educator-assigned grades?",
  "What outcome would make the tool worthwhile: reduced minutes, fewer recording errors, more children assessed, or better progress visibility?",
];

export const team = [
  {
    name: "Aashrith Bhat",
    branch: "CSE",
    strengths: "Editing, social media, vibe coding, prompt engineering, content analysis",
    contribution:
      "Task management and execution, problem research, NGO communication and the project system.",
  },
  {
    name: "Hajira Noorain",
    branch: "ECE",
    strengths: "C programming, technical problem-solving, hardware and ESP32",
    contribution:
      "Designing and testing the technical prototype, sensors and electronics, troubleshooting the system.",
  },
  {
    name: "Sufiyan Ahmed",
    branch: "CSE",
    strengths: "Full-stack web development, presentation, vibe coding",
    contribution:
      "Connecting backends to apps, presenting the work and explaining the solution clearly.",
  },
  {
    name: "Vismay G",
    branch: "ME",
    strengths: "Social media, prompt engineering, presentation and speaking",
    contribution:
      "Team coordination, making sure every voice is heard, research and solution suggestions.",
  },
];

export const sourceLinks = [
  { label: "Task 1 — Understand the problem", file: "/docs/sparkl-task-1-problem.pdf" },
  { label: "Task 2 — Meet the people", file: "/docs/sparkl-task-2-people.pdf" },
  { label: "Task 3 — Study what exists", file: "/docs/sparkl-task-3-landscape.pdf" },
  { label: "Task 4 — Bring it together", file: "/docs/sparkl-task-4-approach.pdf" },
  { label: "Team Syndicate skill map", file: "/docs/sparkl-skill-map.pdf" },
];

export const references = [
  "ASER Centre. ASER 2024 — report, national findings, state pages and survey documents.",
  "ASER Centre. ASER tools — assessment progression and Kannada tool download.",
  "Ministry of Education / Press Information Bureau. NIPUN Bharat Scheme and assessment framework (29 Nov 2021).",
  "PARAKH / NCERT. Foundational Learning Study 2022.",
  "CBSE Academic and Pratham Education Foundation. Assessment of Foundational Reading course.",
  "Karnataka Learning Partnership / Akshara Foundation. Reading Programme, methodology and assessment.",
  "Peer-reviewed study. Kannada akshara knowledge in primary school children: accuracy and reaction time.",
  "Android Developers. Build an offline-first app.",
  "Indian Express. Only 23% of Class 3 government-school students in Karnataka can do subtraction: ASER 2024 (28 Jan 2025).",
  "Pratham Education Foundation. Assessment data in Teaching at the Right Level.",
  "Pratham. Teaching at the Right Level.",
  "J-PAL. Using Learning Camps to Improve Basic Learning Outcomes in India.",
  "Google Read Along. Official product and FAQs; Google Play language listing.",
  "Rocket Learning. Official website.",
  "Chimple. Literacy curriculum and language information.",
  "Khan Academy Kids. Official app information, offline content and pricing.",
  "TaRL Africa. Evidence summary including Madagascar.",
  "UK FCDO / RISE. Embedding Innovation in State Systems: Lessons from Pratham.",
];
