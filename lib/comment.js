// simplug: characters comment on your work when you ask.
//   commentOnFile({ path, text })        -> { lines, speech, offerGL, topic }
//   commentOnMusic({ path, stats })      -> same shape, from midiStats() of the LucianOS platform
// Pure functions: no page, no network, so they can be tested.
import { MUSIC_WORDS, STOPWORDS, TYPICAL } from './words.js';

// The same file gets the same words; different files get variety.
function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
const pick = (list, seed) => list[seed % list.length];
const band = (bands, v) => bands.find((b) => v <= b.max).words;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const listWords = (ws) => (ws.length <= 1 ? ws.join('') : `${ws.slice(0, -1).join(', ')} and ${ws.at(-1)}`);

// Folders whose names contain thesis, doctor or hon (honours) are academic work.
export function isThesisPath(path) {
  return path.split('/').slice(0, -1).some((seg) => /thesis|doctor|hon/i.test(seg));
}

export function keywords(text, n = 3) {
  const counts = new Map();
  for (const w of text.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    const word = w.replace(/'s$/, '');
    if (STOPWORDS.has(word) || word.length < 4) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([w]) => w);
}

export function textStats(text) {
  const words = text.match(/\S+/g) ?? [];
  const prose = text.split('\n').filter((l) => !/^#{1,6}\s/.test(l)).join('\n'); // headings are not sentences
  const sentences = prose.split(/[.!?]+(?:\s|$)|\n\s*\n/).map((s) => s.trim()).filter((s) => /\w/.test(s));
  const lines = text.split('\n');
  return {
    words: words.length,
    lines: lines.length,
    sentences: sentences.length,
    avgSentence: sentences.length ? words.length / sentences.length : 0,
    questions: (text.match(/\?/g) ?? []).length,
    todos: (text.match(/\bTODO\b|\bFIXME\b/g) ?? []).length,
    headings: lines.filter((l) => /^#{1,6}\s/.test(l)).length,
    unique: new Set(words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ''))).size,
    keywords: keywords(text)
  };
}

export function prologStats(text) {
  const noComments = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/%.*$/gm, '');
  const heads = [];
  // clause heads: start of a line, an atom, then ( or :- or .
  for (const m of noComments.matchAll(/^([a-z][A-Za-z0-9_]*)(\(([^)]*)\))?\s*(:-|-->|\.)/gm)) {
    const args = m[3] === undefined ? 0 : m[3].split(',').length;
    heads.push(`${m[1]}/${m[4] === '-->' ? args + 2 : args}`);
  }
  const counts = new Map();
  for (const h of heads) counts.set(h, (counts.get(h) ?? 0) + 1);
  const commentLines = text.split('\n').filter((l) => /^\s*%/.test(l)).length;
  return {
    clauses: heads.length,
    predicates: counts.size,
    biggest: [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null,
    commentLines,
    lines: text.split('\n').length,
    tests: /:-\s*begin_tests|\btest\(/.test(text),
    directives: (noComments.match(/^:-/gm) ?? []).length
  };
}

function glOffer(path, topic) {
  return isThesisPath(path)
    ? { offerGL: true, glLine: `This is in a thesis folder, so it may need detail. Shall I run Grammar Logic on "${topic}"?` }
    : { offerGL: false };
}

function finish(lines, extra) {
  return { lines, speech: lines.join(' '), ...extra };
}

export function commentOnFile({ path, text }) {
  const name = path.split('/').pop();
  const seed = hash(path);
  const isProlog = /\.(pl|pro)$/i.test(name);
  if (!text.trim()) return finish([`${name} is empty so far. What will it be about?`], { offerGL: false, topic: '' });

  const lines = [];
  let topic;
  if (isProlog) {
    const p = prologStats(text);
    topic = name.replace(/\.(pl|pro)$/i, '').replace(/[_-]+/g, ' ');
    lines.push(`${name} has ${plural(p.predicates, 'predicate')} in ${plural(p.clauses, 'clause')}.`);
    if (p.biggest && p.biggest[1] > 2) lines.push(`${p.biggest[0]} does the most work, with ${p.biggest[1]} clauses.`);
    const ratio = p.commentLines / Math.max(1, p.lines);
    lines.push(ratio > 0.15 ? 'It is well commented, which will help later.' : ratio > 0.03 ? 'There are a few comments; one per predicate would make it easier to come back to.' : 'There are hardly any comments. A line above each predicate saying what it does would help.');
    lines.push(p.tests ? 'Good: it has tests.' : 'There are no tests yet. A couple of example queries with expected answers would catch regressions.');
  } else {
    const s = textStats(text);
    topic = s.keywords[0] ?? name.replace(/\.[^.]+$/, '');
    const size = s.words < 150 ? pick(['a short note', 'a quick sketch', 'a brief piece'], seed) : s.words < 1500 ? pick(['a solid piece', 'a good-sized draft', 'a healthy draft'], seed) : pick(['a long work', 'a substantial document', 'a big piece of writing'], seed);
    lines.push(`${name} is ${size}: ${plural(s.words, 'word')} in ${plural(s.sentences || s.lines, s.sentences ? 'sentence' : 'line')}.`);
    if (s.keywords.length) lines.push(`It's mostly about ${listWords(s.keywords)}.`);
    if (s.sentences > 3) {
      lines.push(s.avgSentence > 28 ? 'The sentences are long; splitting a few would make it easier to read.' : s.avgSentence < 9 ? 'The sentences are short and punchy.' : 'The sentences flow at a comfortable length.');
    }
    if (s.questions > 2) lines.push(`You ask ${plural(s.questions, 'question')}; answering them could be the next section.`);
    if (s.todos) lines.push(`There ${s.todos === 1 ? 'is' : 'are'} ${plural(s.todos, 'TODO')} left.`);
  }
  const gl = glOffer(path, topic);
  if (gl.offerGL) lines.push(gl.glLine);
  else lines.push(pick([`Next, you could connect it to a project, or start a new one about ${topic}.`, `Shall I remind you about ${topic} later?`, `It could grow into its own project about ${topic}.`], seed >>> 3));
  return finish(lines, { offerGL: gl.offerGL, topic });
}

// stats: from midiStats() in /shared/midi.js
export function commentOnMusic({ path, stats }) {
  const name = path.split('/').pop();
  const seed = hash(path);
  if (stats.empty) return finish([`${name} has no tuned notes${stats.drums ? ', just drums' : ''}.`], { offerGL: false, topic: '' });
  const W = MUSIC_WORDS;
  const words = [];
  words.push(pick(band(W.tempo, stats.tempo), seed));
  words.push(pick(W.mode[stats.mode] ?? W.mode.major, seed >>> 2));
  if (stats.stepRatio > 0.6) words.push(pick(W.motion.steps, seed >>> 4));
  else if (stats.leapRatio > 0.5) words.push(pick(W.motion.leaps, seed >>> 4));
  else if (stats.repeatRatio > 0.4) words.push(pick(W.motion.repeats, seed >>> 4));
  words.push(pick(band(W.density, stats.density), seed >>> 6));
  if (stats.chordiness > 2.5) words.push(pick(W.chords, seed >>> 8));
  if (stats.meanVelocity > 100) words.push(pick(W.loud, seed >>> 9));
  else if (stats.meanVelocity < 60) words.push(pick(W.soft, seed >>> 9));
  const unique = [...new Set(words)].slice(0, 4);

  // what is statistically unusual, compared with a typical song
  const unusual = Object.entries(TYPICAL)
    .map(([k, t]) => ({ k, t, z: (stats[k] - t.mean) / t.spread }))
    .filter((x) => Number.isFinite(x.z))
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))[0];

  const minutes = Math.floor(stats.duration / 60);
  const secs = Math.round(stats.duration % 60);
  const lines = [
    `${name} sounds ${listWords(unique)}.`,
    `It's in ${stats.key}, about ${stats.tempo} beats a minute, ${minutes ? `${minutes} min ${secs} s` : `${secs} seconds`} long.`
  ];
  if (unusual && Math.abs(unusual.z) >= 1) {
    lines.push(`What stands out is ${unusual.z > 0 ? unusual.t.more : unusual.t.less} (${unusual.t.unit(stats[unusual.k])}).`);
  } else {
    lines.push('Nothing about it is unusual; it sits right in the middle of a typical song.');
  }
  lines.push(stats.range > 24 ? 'The melody covers a lot of ground; a singer would need a wide voice.' : 'A singer could manage the range comfortably.');
  return finish(lines, { offerGL: false, topic: '' });
}
