import type { Item, Rung, Subject, SubjectId } from "../types";

export const SUBJECTS: Subject[] = [
  {
    id: "kannada",
    name: "Kannada",
    sample: "ಅ",
    description: "Akshara, kagunita, words, clusters, connected text and story.",
    ladderNote: "The ladder follows Kannada's own akshara sequence — not English translated into Kannada.",
    topNote: "Story is the top rung of this draft ladder (Std 3 foundational benchmark).",
  },
  {
    id: "english",
    name: "English",
    sample: "Aa",
    description: "Letters, sounds, words, paragraph, story and comprehension.",
    ladderNote: "Letter names and letter sounds are separate rungs, so a child is not marked down for mixing them.",
    topNote: "Comprehension is the top rung of this draft ladder (Std 3 foundational benchmark).",
  },
  {
    id: "maths",
    name: "Maths",
    sample: "123",
    description: "Number sense, two-digit numbers, operations, tables and division.",
    ladderNote: "Children say the answer; the educator enters it. Paper is allowed from the subtraction rung.",
    topNote: "Division is the top rung of this draft ladder (Std 4 foundational benchmark).",
  },
];

const KANNADA_STORY_1 =
  "ಮೀನಾ ಒಂದು ಸಣ್ಣ ಹಳ್ಳಿಯಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದಳು. ಒಂದು ದಿನ ಆಕಾಶವು ಮೋಡಗಳಿಂದ ತುಂಬಿತು. ಮಳೆ ಬರುತ್ತದೆ ಎಂದು ಅವಳು ತಿಳಿದುಕೊಂಡಳು. ಅವಳು ಬೇಗನೆ ಮನೆಗೆ ಓಡಿದಳು. ದಾರಿಯಲ್ಲಿ ಒಂದು ಸಣ್ಣ ಮರಿ ಹಕ್ಕಿ ನೆಲದ ಮೇಲೆ ಬಿದ್ದಿತ್ತು. ಮೀನಾ ಅದನ್ನು ಎತ್ತಿಕೊಂಡು ಮರದ ಕೊಂಬೆಗೆ ಇಟ್ಟಳು. ಮಳೆ ನಿಂತ ಮೇಲೆ ಹಕ್ಕಿ ಸಂತೋಷದಿಂದ ಹಾರಿಹೋಯಿತು.";

const KANNADA_STORY_2 =
  "ರಾಜುಗೆ ಒಂದು ಸಣ್ಣ ಗಿಡ ಕೊಡುಗೆಯಾಗಿ ಸಿಕ್ಕಿತು. ಅವನು ಅದನ್ನು ಮನೆಯ ಮುಂದೆ ನೆಟ್ಟನು. ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ನೀರು ಹಾಕುತ್ತಿದ್ದನು. ಕೆಲವು ದಿನಗಳ ನಂತರ ಗಿಡಕ್ಕೆ ಹಸಿರು ಎಲೆಗಳು ಬಂದವು. ಒಂದು ಬೆಳಿಗ್ಗೆ ಅದರ ಮೇಲೆ ಎರಡು ಚಿಕ್ಕ ಹೂವುಗಳು ಅರಳಿದ್ದವು. ರಾಜು ತನ್ನ ಅಮ್ಮನನ್ನು ಕರೆದು ತೋರಿಸಿದನು. ಅವರಿಬ್ಬರೂ ಸಂತೋಷಪಟ್ಟರು.";

const ENGLISH_STORY_1 =
  "A small kitten sat under the mango tree. It was hungry and alone. Meena saw the kitten and gave it some milk. The kitten drank the milk and purred. It followed Meena home. Now the kitten sleeps by the door every night.";

const ENGLISH_STORY_2 =
  "One morning, Avi found a seed on the road. He put it in a small pot and kept the pot near the window. Every day, he gave it a little water. After a week, a tiny green leaf came out. Avi was very happy. He showed the plant to his friends.";

const read = (id: string, content: string, extra: Partial<Item> = {}): Item => ({
  id,
  kind: "read",
  content,
  spoken: content,
  ...extra,
});

const say = (id: string, content: string, extra: Partial<Item> = {}): Item => ({
  id,
  kind: "say",
  content,
  manualOnly: true,
  ...extra,
});

const answer = (id: string, content: string, expected: string, extra: Partial<Item> = {}): Item => ({
  id,
  kind: "answer",
  content,
  answer: expected,
  accept: [expected],
  ...extra,
});

const dots = (id: string, count: number): Item => ({
  id,
  kind: "dots",
  content: String(count),
  dots: count,
  answer: String(count),
  accept: [String(count)],
});

export const RUNGS: Rung[] = [
  // ── Kannada ────────────────────────────────────────────────────────────────
  {
    id: "kn-1",
    subject: "kannada",
    order: 1,
    name: "Akshara",
    kannadaName: "ಅಕ್ಷರ",
    benchmark: 1,
    focus: "Vowels and base consonants",
    instruction: "Read these letters aloud.",
    kannadaInstruction: "ಈ ಅಕ್ಷರಗಳನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read("kn-1-a", "ಅ ಆ ಇ ಈ ಉ ಊ"),
      read("kn-1-b", "ಕ ಖ ಗ ಘ ಙ"),
      read("kn-1-c", "ಟ ಠ ಡ ಢ ಣ"),
      read("kn-1-d", "ಪ ಫ ಬ ಭ ಮ"),
    ],
    nextStep:
      "Practise five aksharas a day with picture cards, then blend them into spoken words.",
  },
  {
    id: "kn-2",
    subject: "kannada",
    order: 2,
    name: "Kagunita",
    kannadaName: "ಕಗುಣಿತ",
    benchmark: 1,
    focus: "Consonants with vowel signs",
    instruction: "Read each row aloud.",
    kannadaInstruction: "ಪ್ರತಿ ಸಾಲನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read("kn-2-a", "ಕಾ ಕಿ ಕೀ ಕು ಕೂ"),
      read("kn-2-b", "ಗೆ ಗೇ ಗೈ ಗೊ ಗೋ"),
      read("kn-2-c", "ಚಾ ಚಿ ಚು ಚೆ ಚೊ"),
      read("kn-2-d", "ತಾ ತಿ ತೀ ತು ತೂ"),
    ],
    nextStep:
      "Build kagunita rows in a sand tray or with letter cards, then find the same forms inside simple words.",
  },
  {
    id: "kn-3",
    subject: "kannada",
    order: 3,
    name: "Words",
    kannadaName: "ಪದಗಳು",
    benchmark: 1,
    focus: "Simple word decoding",
    instruction: "Read this word aloud.",
    kannadaInstruction: "ಈ ಪದವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read("kn-3-a", "ಮನೆ"),
      read("kn-3-b", "ನೀರು"),
      read("kn-3-c", "ಶಾಲೆ"),
      read("kn-3-d", "ಅಮ್ಮ"),
      read("kn-3-e", "ಹೂವು"),
      read("kn-3-f", "ಹಾಲು"),
      read("kn-3-g", "ಬೆಂಕಿ"),
      read("kn-3-h", "ಗಿಡ"),
      read("kn-3-i", "ಕೈ"),
      read("kn-3-j", "ಮಳೆ"),
      read("kn-3-k", "ಪುಸ್ತಕ"),
      read("kn-3-l", "ರೊಟ್ಟಿ"),
    ],
    nextStep:
      "Read ten simple words daily, match each word to a picture, then use it in a spoken sentence.",
  },
  {
    id: "kn-4",
    subject: "kannada",
    order: 4,
    name: "Clusters",
    kannadaName: "ಸಂಯುಕ್ತಾಕ್ಷರ",
    benchmark: 2,
    focus: "Conjunct and cluster forms",
    instruction: "Read this word aloud.",
    kannadaInstruction: "ಈ ಪದವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    complexity: "Consonant clusters and conjunct forms",
    items: [
      read("kn-4-a", "ಸ್ನೇಹ"),
      read("kn-4-b", "ವಿದ್ಯೆ"),
      read("kn-4-c", "ಕ್ಷೇತ್ರ"),
      read("kn-4-d", "ಜ್ಞಾನ"),
      read("kn-4-e", "ಸ್ತ್ರೀ"),
      read("kn-4-f", "ಗ್ರಂಥ"),
      read("kn-4-g", "ಸ್ವಾಮಿ"),
      read("kn-4-h", "ಅಂಗಡಿ"),
      read("kn-4-i", "ಚಂದ್ರ"),
      read("kn-4-j", "ಸಂಕಲ್ಪ"),
    ],
    nextStep:
      "Split cluster words into parts (ಸ್ನೇ + ಹ), build them with letter cards and read five a day.",
  },
  {
    id: "kn-5",
    subject: "kannada",
    order: 5,
    name: "Paragraph",
    kannadaName: "ಪ್ಯಾರಾಗ್ರಾಫ್",
    benchmark: 2,
    focus: "Connected text",
    instruction: "Read this paragraph aloud.",
    kannadaInstruction: "ಈ ಪ್ಯಾರಾಗ್ರಾಫ್ ಅನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read(
        "kn-5-a",
        "ನಮ್ಮ ಶಾಲೆ ಒಂದು ಸುಂದರವಾದ ಸ್ಥಳ. ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಮಕ್ಕಳು ಮನೆಯಿಂದ ಶಾಲೆಗೆ ಬರುತ್ತಾರೆ. ಶಿಕ್ಷಕರು ಅವರಿಗೆ ಪಾಠ ಹೇಳಿಕೊಡುತ್ತಾರೆ. ಮಧ್ಯಾಹ್ನ ಎಲ್ಲರೂ ಒಟ್ಟಿಗೆ ಊಟ ಮಾಡುತ್ತಾರೆ.",
      ),
      read(
        "kn-5-b",
        "ಅಜ್ಜಿ ಮನೆಯ ಅಂಗಳದಲ್ಲಿ ಹೂವಿನ ಗಿಡಗಳಿವೆ. ಬೆಳಿಗ್ಗೆ ಅವಳು ಗಿಡಗಳಿಗೆ ನೀರು ಹಾಕುತ್ತಾಳೆ. ಮಕ್ಕಳು ಬಂದಾಗ ಅವಳು ಅವರಿಗೆ ಹೂವುಗಳನ್ನು ತೋರಿಸುತ್ತಾಳೆ. ಎಲ್ಲರಿಗೂ ಅವು ತುಂಬಾ ಇಷ್ಟ.",
      ),
    ],
    nextStep:
      "Read four connected sentences twice, point under each word, then ask one 'who' or 'where' question.",
  },
  {
    id: "kn-6",
    subject: "kannada",
    order: 6,
    name: "Story",
    kannadaName: "ಕಥೆ",
    benchmark: 3,
    focus: "Story reading",
    instruction: "Read this story aloud. Take your time.",
    kannadaInstruction: "ಈ ಕಥೆಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ. ಆತುರಪಡಬೇಡಿ.",
    items: [read("kn-6-a", KANNADA_STORY_1), read("kn-6-b", KANNADA_STORY_2)],
    nextStep:
      "Read a short story aloud, retell it in three sentences and talk about any new word together.",
  },

  // ── English ────────────────────────────────────────────────────────────────
  {
    id: "en-1",
    subject: "english",
    order: 1,
    name: "Letters",
    benchmark: 1,
    focus: "Letter recognition",
    instruction: "Say the name of each letter.",
    kannadaInstruction: "ಪ್ರತಿ ಅಕ್ಷರದ ಹೆಸರನ್ನು ಹೇಳಿ.",
    items: [
      read("en-1-a", "A  E  I  O  U"),
      read("en-1-b", "b  d  p  q"),
      read("en-1-c", "m  n  r  s  t"),
      read("en-1-d", "K  W  X  Y  Z"),
    ],
    nextStep:
      "Practise five letter names a day and match uppercase to lowercase with letter cards.",
  },
  {
    id: "en-2",
    subject: "english",
    order: 2,
    name: "Sounds",
    benchmark: 1,
    focus: "Letter sounds and phonics",
    instruction: "Say the sound this letter makes.",
    kannadaInstruction: "ಈ ಅಕ್ಷರ ಮಾಡುವ ಶಬ್ದವನ್ನು ಹೇಳಿ.",
    items: [
      say("en-2-a", "m"),
      say("en-2-b", "s"),
      say("en-2-c", "a"),
      say("en-2-d", "t"),
      say("en-2-e", "sh"),
      say("en-2-f", "ch"),
    ],
    nextStep:
      "Say the sound, not the letter name: m, s, a, t. Then blend three sounds into a word.",
  },
  {
    id: "en-3",
    subject: "english",
    order: 3,
    name: "Words",
    benchmark: 1,
    focus: "Word reading",
    instruction: "Read this word aloud.",
    kannadaInstruction: "ಈ ಪದವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read("en-3-a", "cat"),
      read("en-3-b", "sun"),
      read("en-3-c", "water"),
      read("en-3-d", "school"),
      read("en-3-e", "mother"),
      read("en-3-f", "bird"),
      read("en-3-g", "milk"),
      read("en-3-h", "tree"),
      read("en-3-i", "hand"),
      read("en-3-j", "rain"),
      read("en-3-k", "book"),
      read("en-3-l", "home"),
    ],
    nextStep:
      "Blend sound-by-sound, read ten word cards and match each word to a picture before reading it again.",
  },
  {
    id: "en-4",
    subject: "english",
    order: 4,
    name: "Paragraph",
    benchmark: 2,
    focus: "Connected text",
    instruction: "Read this paragraph aloud.",
    kannadaInstruction: "ಈ ಪ್ಯಾರಾಗ್ರಾಫ್ ಅನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read(
        "en-4-a",
        "The sun rises in the east. The children walk to school together. They carry their books and water bottles. At school, they read, play and sing.",
      ),
      read(
        "en-4-b",
        "Our garden has many plants. Every morning, Amma waters the plants. The red flowers open in the sun. Birds come to drink water from the pot.",
      ),
    ],
    nextStep:
      "Read four connected sentences twice, point under each word and note where reading slows down.",
  },
  {
    id: "en-5",
    subject: "english",
    order: 5,
    name: "Story",
    benchmark: 2,
    focus: "Story reading",
    instruction: "Read this story aloud. Take your time.",
    kannadaInstruction: "ಈ ಕಥೆಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ. ಆತುರಪಡಬೇಡಿ.",
    items: [read("en-5-a", ENGLISH_STORY_1), read("en-5-b", ENGLISH_STORY_2)],
    nextStep:
      "Read a short story and retell the beginning, middle and end without looking back.",
  },
  {
    id: "en-6",
    subject: "english",
    order: 6,
    name: "Comprehension",
    benchmark: 3,
    focus: "Understanding what was read",
    instruction: "Answer in your own words. The educator marks the answer.",
    kannadaInstruction: "ನಿಮ್ಮ ಮಾತುಗಳಲ್ಲಿ ಉತ್ತರಿಸಿ. ಶಿಕ್ಷಕರು ಗುರುತಿಸುತ್ತಾರೆ.",
    items: [
      {
        id: "en-6-a",
        kind: "comprehension",
        content: "Where was the kitten sitting?",
        answer: "Under the mango tree.",
        passage: ENGLISH_STORY_1,
        manualOnly: true,
      },
      {
        id: "en-6-b",
        kind: "comprehension",
        content: "What did Meena give the kitten?",
        answer: "Some milk.",
        passage: ENGLISH_STORY_1,
        manualOnly: true,
      },
      {
        id: "en-6-c",
        kind: "comprehension",
        content: "How do we know the kitten was happy?",
        answer: "It purred, followed Meena home and sleeps by the door.",
        passage: ENGLISH_STORY_1,
        manualOnly: true,
      },
      {
        id: "en-6-d",
        kind: "comprehension",
        content: "What did Avi do every day after he found the seed?",
        answer: "He gave it a little water.",
        passage: ENGLISH_STORY_2,
        manualOnly: true,
      },
    ],
    nextStep:
      "Read a short story and answer who, what, where and why questions in full sentences.",
  },

  // ── Maths ──────────────────────────────────────────────────────────────────
  {
    id: "ma-1",
    subject: "maths",
    order: 1,
    name: "Numbers to 9",
    benchmark: 1,
    focus: "Counting and number sense",
    instruction: "Count the dots and say the number.",
    kannadaInstruction: "ಚುಕ್ಕಿಗಳನ್ನು ಎಣಿಸಿ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಿ.",
    items: [
      dots("ma-1-a", 5),
      dots("ma-1-b", 7),
      dots("ma-1-c", 9),
      answer("ma-1-d", "What comes after 8?", "9"),
    ],
    nextStep:
      "Count real objects to ten, match numerals to quantities and play 'one more, one less'.",
  },
  {
    id: "ma-2",
    subject: "maths",
    order: 2,
    name: "Numbers to 99",
    benchmark: 1,
    focus: "Two-digit numbers",
    instruction: "Read the numbers aloud.",
    kannadaInstruction: "ಸಂಖ್ಯೆಗಳನ್ನು ಗಟ್ಟಿಯಾಗಿ ಓದಿ.",
    items: [
      read("ma-2-a", "27   54   86"),
      answer("ma-2-b", "What comes after 39?", "40"),
      answer("ma-2-c", "Which is more: 54 or 45?", "54"),
      answer("ma-2-d", "What comes before 70?", "69"),
    ],
    nextStep:
      "Read and write numbers to 99, use a hundreds chart and compare pairs with 'more' and 'less'.",
  },
  {
    id: "ma-3",
    subject: "maths",
    order: 3,
    name: "Add & subtract",
    benchmark: 2,
    focus: "Sums within 20",
    instruction: "Say the answer. You may use your fingers.",
    kannadaInstruction: "ಉತ್ತರವನ್ನು ಹೇಳಿ. ಬೆರಳುಗಳನ್ನು ಬಳಸಬಹುದು.",
    items: [
      answer("ma-3-a", "8 + 5", "13"),
      answer("ma-3-b", "14 − 6", "8"),
      answer("ma-3-c", "9 + 7", "16"),
      answer("ma-3-d", "7 + 8", "15"),
    ],
    nextStep:
      "Use counters and a number line for sums within 20; say the answer aloud before writing it.",
  },
  {
    id: "ma-4",
    subject: "maths",
    order: 4,
    name: "Borrowing",
    benchmark: 2,
    focus: "Two-digit subtraction",
    instruction: "Say the answer. You may use paper.",
    kannadaInstruction: "ಉತ್ತರವನ್ನು ಹೇಳಿ. ಕಾಗದವನ್ನು ಬಳಸಬಹುದು.",
    items: [
      answer("ma-4-a", "42 − 17", "25"),
      answer("ma-4-b", "63 − 28", "35"),
      answer("ma-4-c", "81 − 45", "36"),
      answer("ma-4-d", "70 − 36", "34"),
    ],
    nextStep:
      "Practise borrowing with base-ten blocks and say each step aloud before writing the answer.",
  },
  {
    id: "ma-5",
    subject: "maths",
    order: 5,
    name: "Multiplication",
    benchmark: 3,
    focus: "Tables to 10",
    instruction: "Say the answer.",
    kannadaInstruction: "ಉತ್ತರವನ್ನು ಹೇಳಿ.",
    items: [
      answer("ma-5-a", "6 × 4", "24"),
      answer("ma-5-b", "7 × 8", "56"),
      answer("ma-5-c", "9 × 3", "27"),
      answer("ma-5-d", "8 × 6", "48"),
    ],
    nextStep:
      "Build arrays with counters and practise tables 2–9 for five minutes a day, out loud.",
  },
  {
    id: "ma-6",
    subject: "maths",
    order: 6,
    name: "Division",
    benchmark: 4,
    focus: "Sharing into equal groups",
    instruction: "Say the answer. You may use paper.",
    kannadaInstruction: "ಉತ್ತರವನ್ನು ಹೇಳಿ. ಕಾಗದವನ್ನು ಬಳಸಬಹುದು.",
    items: [
      answer("ma-6-a", "84 ÷ 7", "12"),
      answer("ma-6-b", "144 ÷ 6", "24"),
      answer("ma-6-c", "315 ÷ 9", "35"),
      answer("ma-6-d", "96 ÷ 8", "12"),
    ],
    nextStep:
      "Share objects into equal groups, then connect each division fact to a multiplication fact.",
  },
];

const SHORT_NAMES: Record<string, string> = {
  "kn-1": "Akshara",
  "kn-2": "Kagunita",
  "kn-3": "Words",
  "kn-4": "Clusters",
  "kn-5": "Paragraph",
  "kn-6": "Story",
  "en-1": "Letters",
  "en-2": "Sounds",
  "en-3": "Words",
  "en-4": "Paragraph",
  "en-5": "Story",
  "en-6": "Comprehension",
  "ma-1": "1 to 9",
  "ma-2": "To 99",
  "ma-3": "Add & subtract",
  "ma-4": "Borrowing",
  "ma-5": "Tables",
  "ma-6": "Division",
};

export function shortRungName(rung: Rung): string {
  return SHORT_NAMES[rung.id] ?? rung.name;
}

export const SUBJECT_ORDER: SubjectId[] = ["kannada", "english", "maths"];

export const getSubject = (id: SubjectId): Subject =>
  SUBJECTS.find((subject) => subject.id === id) ?? SUBJECTS[0];

export const getRungs = (subject: SubjectId): Rung[] =>
  RUNGS.filter((rung) => rung.subject === subject).sort((a, b) => a.order - b.order);

export const getRung = (subject: SubjectId, order: number): Rung | undefined =>
  getRungs(subject).find((rung) => rung.order === order);

export const getRungById = (id: string): Rung | undefined =>
  RUNGS.find((rung) => rung.id === id);

export const topOrder = (subject: SubjectId): number => getRungs(subject).length;
