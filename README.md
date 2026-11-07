# simplug

The LucianOS character comments on your work when you ask, and suggests what to do next. It's part of the [LucianOS suite](https://github.com/luciangreen/lucianos).

## Install

simplug runs inside the LucianOS platform:

```sh
cd lucianos/apps
git clone https://github.com/luciangreen/simplug
```

## Ways to ask

| Where | How |
| --- | --- |
| LucianOS desktop | Select a file, then choose **File ▸ Ask the character about it**, or say "comment on notes" or "what do you think of song one" |
| Today's music window | Press 💬 next to a song |
| The simplug app | Open `/apps/simplug/` (or `?open=path`), choose a file and press **What do you think?** |

## What it says

- **Writing** (text, Markdown):
  - How long it is and what it is mostly about (its keywords).
  - How the sentences read, any questions you asked, and TODOs left.
  - A next step: connect it to a project, start a new one, or be reminded later.
- **Prolog:**
  - How many predicates and clauses it has, and which predicate does the most work.
  - Whether it is commented, and whether it has tests.
- **Music** (Music-Composer `.mid` files):
  - Words that summarise the sound, from the dictionary in `lib/words.js`. The words come from tempo, key (major or minor), how the tune moves (steps, leaps, repeats), how busy it is, chords and loudness.
  - It compares the song with a typical song and says what stands out, for example "many leaps in the tune (100% leaps)".
- **Thesis work:** a file in a folder whose name contains *thesis*, *doctor* or *hon* gets an offer to run Grammar Logic on its main topic for more detail. The offer runs on the LucianOS desktop.

The same file always gets the same words, and different files get variety.

## Tests

```sh
npm test
```

The tests cover the statistics, the dictionary words, thesis-folder detection, and a check that no comment ever says "undefined".

## Coming next

From the plan:

- An idea store, where each idea is integrated, made a new project, or deferred until it comes up again.
- Characters recalling earlier successes from matching keywords.
- Suggesting a break when enough ideas are done.
