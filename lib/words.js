// The dictionary simplug uses to put sounds and texts into words.
// Each feature has bands; each band has words that summarise how it sounds.

export const MUSIC_WORDS = {
  tempo: [
    { max: 80, words: ['unhurried', 'stately', 'gentle'] },
    { max: 120, words: ['easy-going', 'steady', 'walking-pace'] },
    { max: Infinity, words: ['lively', 'driving', 'brisk'] }
  ],
  density: [
    { max: 2.5, words: ['spacious', 'airy', 'sparse'] },
    { max: 7, words: ['flowing', 'well-paced', 'balanced'] },
    { max: Infinity, words: ['busy', 'bustling', 'dense'] }
  ],
  range: [
    { max: 12, words: ['compact', 'intimate', 'close-knit'] },
    { max: 24, words: ['broad', 'open', 'roomy'] },
    { max: Infinity, words: ['sweeping', 'soaring', 'expansive'] }
  ],
  mode: { major: ['bright', 'sunny', 'hopeful'], minor: ['wistful', 'moody', 'reflective'] },
  motion: {
    steps: ['smooth', 'singable', 'stepwise'],
    leaps: ['angular', 'adventurous', 'leaping'],
    repeats: ['insistent', 'chant-like', 'hypnotic']
  },
  chords: ['rich', 'full-chorded', 'lush'],
  loud: ['bold', 'punchy', 'confident'],
  soft: ['soft', 'hushed', 'tender'],
  high: ['light', 'high and clear', 'sparkling'],
  low: ['deep', 'low and warm', 'grounded']
};

// What a typical pop song looks like, to find what stands out.
export const TYPICAL = {
  tempo: { mean: 110, spread: 25, more: 'a fast tempo', less: 'a slow tempo', unit: (v) => `${Math.round(v)} beats a minute` },
  density: { mean: 5, spread: 3, more: 'a lot of notes', less: 'very few notes', unit: (v) => `${v.toFixed(1)} notes a second` },
  range: { mean: 19, spread: 7, more: 'a very wide range', less: 'a narrow range', unit: (v) => `${v} semitones` },
  leapRatio: { mean: 0.35, spread: 0.2, more: 'many leaps in the tune', less: 'hardly any leaps', unit: (v) => `${Math.round(v * 100)}% leaps` },
  repeatRatio: { mean: 0.2, spread: 0.15, more: 'lots of repeated notes', less: 'almost no repeated notes', unit: (v) => `${Math.round(v * 100)}% repeats` }
};

export const STOPWORDS = new Set(`a an the and or but if then else of to in on at by for with from as is are was were be been being am it its this that these those
there here i you he she we they me him her us them my your his our their not no yes so do does did done have has had will would can could should
may might must shall into out up down over under again more most some any all each other such only own same than too very just also about what which
who whom when where why how one two three new use used using get got let lets make made like well way per via etc`.split(/\s+/));
