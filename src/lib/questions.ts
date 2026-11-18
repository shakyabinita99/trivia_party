import type { Question } from './types';

export const SAMPLE = `What is the largest planet in our solar system?
- Saturn
* Jupiter
- Neptune
- Earth

How many sides does a hexagon have?
- 5
* 6
- 7
- 8

Which country is home to the kangaroo?
- New Zealand
- South Africa
* Australia
- Brazil

What is the chemical symbol for gold?
* Au
- Ag
- Gd
- Go

Who painted the Mona Lisa?
- Michelangelo
- Van Gogh
- Picasso
* Leonardo da Vinci

What is the capital of Japan?
- Osaka
* Tokyo
- Kyoto
- Seoul

How many continents are there?
- 5
- 6
* 7
- 8

Which ocean is the largest?
- Atlantic
- Indian
* Pacific
- Arctic

The Great Wall is located in which country?
* China
- India
- Japan
- Mongolia

What is the freezing point of water in Celsius?
* 0°
- 32°
- 100°
- -10°

Which planet is known as the Red Planet?
- Venus
* Mars
- Mercury
- Jupiter

What is the fastest land animal?
- Lion
- Horse
* Cheetah
- Gazelle

A tomato is a fruit.
* True
- False

What was the launch price of the original 4GB iPhone in 2007?
= $499

How many players are on a soccer team on the field?
- 9
- 10
* 11
- 12

What is the hardest natural substance?
- Gold
- Iron
* Diamond
- Quartz`;

export const QUESTIONS_KEY = 'trivia-questions';

type Parsed = { qs: Question[]; err: string | null };

/**
 * Format: question line, then 2–4 choice lines starting with "-" (wrong) or "*" (correct),
 * or a single "= value" line for a closest-guess question (e.g. "= $1299", "= 42 kg").
 * Questions are separated by a blank line.
 */
export function parse(src: string, time: number): Parsed {
  const blocks = src
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  const qs: Question[] = [];
  const fail = (i: number, msg: string): Parsed => ({ qs: [], err: `Question ${i + 1}: ${msg}` });

  for (const [i, block] of blocks.entries()) {
    const [text, ...lines] = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const eq = lines.filter((l) => l.startsWith('='));
    if (eq.length) {
      if (eq.length > 1 || lines.length > 1) return fail(i, 'a price/number question has only one "=" line.');
      const m = /^=\s*([^\d\s.-]*)\s*(-?[\d,]*\.?\d+)\s*(.*)$/.exec(eq[0]);
      const val = m ? Number(m[2].replace(/,/g, '')) : NaN;
      if (!m || !Number.isFinite(val)) return fail(i, `"${eq[0]}" should look like "= $1299" or "= 42 kg".`);
      qs.push({
        text: text.slice(0, 200),
        choices: [],
        answer: val,
        time: Math.max(time, 20),
        kind: 'number',
        pre: m[1].slice(0, 5),
        suf: m[3].trim().slice(0, 12),
      });
      continue;
    }
    const choices: string[] = [];
    let answer = -1;
    for (const line of lines) {
      const m = /^([*-])\s*(.+)$/.exec(line);
      if (!m) return fail(i, `"${line}" must start with "-" or "*".`);
      if (m[1] === '*') {
        if (answer >= 0) return fail(i, 'only one answer can be marked with "*".');
        answer = choices.length;
      }
      choices.push(m[2].slice(0, 80));
    }
    if (choices.length < 2 || choices.length > 4) return fail(i, 'needs 2 to 4 choices.');
    if (answer < 0) return fail(i, 'mark the correct answer with "*".');
    qs.push({ text: text.slice(0, 200), choices, answer, time });
  }
  return qs.length ? { qs, err: null } : { qs, err: 'Add at least one question.' };
}
