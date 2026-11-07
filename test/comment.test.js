import assert from 'node:assert/strict';
import { test } from 'node:test';
import { commentOnFile, commentOnMusic, isThesisPath, keywords, prologStats, textStats } from '../lib/comment.js';

test('thesis, doctor and hon folders are recognised', () => {
  assert.ok(isThesisPath('Dropbox/PhD Thesis/chapter1.txt'));
  assert.ok(isThesisPath('Uni/Doctorate/notes.md'));
  assert.ok(isThesisPath('Uni/Honours/a.txt'));
  assert.ok(!isThesisPath('Desktop/thesis.txt'), 'only folder names count, not the file name');
  assert.ok(!isThesisPath('Desktop/notes/a.txt'));
});

test('keywords skip common words', () => {
  assert.deepEqual(keywords('The breasoning helps. Breasoning is about meditation and the meditation of breasoning.'), ['breasoning', 'meditation']);
});

test('text statistics', () => {
  const s = textStats('# Title\nOne sentence here. Another one? TODO: finish.\n');
  assert.equal(s.headings, 1);
  assert.equal(s.questions, 1);
  assert.equal(s.todos, 1);
  assert.equal(s.sentences, 3);
});

test('Prolog statistics', () => {
  const p = prologStats(`% adds\nadd(A,B,C) :- C is A+B.\nadd(0,B,B).\nmain :- add(1,2,X), writeln(X).\ngreeting --> [hello].\n:- initialization(main).\n`);
  assert.equal(p.predicates, 3);
  assert.equal(p.clauses, 4);
  assert.deepEqual(p.biggest, ['add/3', 2]);
  assert.equal(p.commentLines, 1);
  assert.equal(p.directives, 1);
  assert.ok(p.predicates && !p.tests);
  assert.equal(prologStats('greeting(X) --> [X].').biggest[0], 'greeting/3');
});

test('comments on writing', () => {
  const text = 'Breasoning helps writing. Breasoning is practice. Meditation supports breasoning. Meditation is calm. What next? Why? How?';
  const c = commentOnFile({ path: 'Desktop/ideas.txt', text });
  assert.match(c.lines[0], /ideas\.txt is a (short note|quick sketch|brief piece)/);
  assert.match(c.speech, /mostly about breasoning and meditation/);
  assert.match(c.speech, /You ask 3 questions/);
  assert.equal(c.offerGL, false);
  assert.deepEqual(commentOnFile({ path: 'Desktop/ideas.txt', text }), c, 'same file, same comment');
});

test('thesis folders get a Grammar Logic offer', () => {
  const c = commentOnFile({ path: 'Uni/Thesis/ch1.txt', text: 'Pedagogy and pedagogy and meditation. Meditation.' });
  assert.equal(c.offerGL, true);
  assert.equal(c.topic, 'meditation');
  assert.match(c.speech, /Grammar Logic on "meditation"/);
});

test('comments on Prolog', () => {
  const c = commentOnFile({ path: 'x/a.pl', text: 'a(1).\na(2).\na(3).\nb :- a(_).\n' });
  assert.match(c.speech, /2 predicates in 4 clauses/);
  assert.match(c.speech, /a\/1 does the most work/);
  assert.match(c.speech, /no tests yet/);
});

test('comments on music use the dictionary and what stands out', () => {
  const stats = { notes: 400, drums: 0, duration: 95, tempo: 168, range: 34, meanPitch: 70, density: 4.2, chordiness: 1.2, stepRatio: 0.3, leapRatio: 0.55, repeatRatio: 0.15, meanVelocity: 112, key: 'A minor', mode: 'minor' };
  const c = commentOnMusic({ path: 'Music-Composer/song1.mid', stats });
  assert.match(c.lines[0], /song1\.mid sounds /);
  assert.match(c.lines[0], /lively|driving|brisk/);
  assert.match(c.lines[0], /wistful|moody|reflective/);
  assert.match(c.lines[1], /A minor, about 168 beats a minute, 1 min 35 s long/);
  assert.match(c.lines[2], /a very wide range \(34 semitones\)|a fast tempo/);
  assert.match(c.lines[3], /wide voice/);
  assert.match(commentOnMusic({ path: 'd.mid', stats: { empty: true, drums: 12 } }).speech, /just drums/);
  // every file name gives real words (no "undefined" from the word picker)
  for (let i = 0; i < 300; i++) {
    const t = commentOnMusic({ path: `Music-Composer/song${i}.mid`, stats: { ...stats, stepRatio: i % 3 === 0 ? 0.8 : 0.1, leapRatio: i % 3 === 1 ? 0.7 : 0.1, repeatRatio: i % 3 === 2 ? 0.6 : 0.1, chordiness: 3, meanVelocity: i % 2 ? 40 : 120 } });
    assert.doesNotMatch(t.speech, /undefined/, `song${i}`);
  }
  for (let i = 0; i < 300; i++) assert.doesNotMatch(commentOnFile({ path: `d/${i}.txt`, text: 'Word word again. Again word.' }).speech, /undefined/);
});
