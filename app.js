// simplug app: choose a file and ask the character for its comments.
import { api } from '/shared/api.js';
import { mountCharacter } from '/shared/character/character.js';
import { bestMatch } from '/shared/character/commands.js';
import { midiStats, parseMidi, playMidi } from '/shared/midi.js';
import { commentOnFile, commentOnMusic } from './lib/comment.js';

const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter((k) => k !== null && k !== undefined));
  return n;
};
const isMidi = (p) => /\.midi?$/i.test(p);
let folder = '';
let entries = [];
let chosen = null;
let player = null;
let character = null;
let lastTopic = '';

export async function commentOn(path) {
  if (isMidi(path)) {
    const res = await fetch(api.files.rawUrl(path), { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`Could not read ${path}`);
    const song = parseMidi(new Uint8Array(await res.arrayBuffer()));
    return commentOnMusic({ path, stats: midiStats(song) });
  }
  const { content } = await api.files.read(path);
  return commentOnFile({ path, text: content });
}

async function show(f) {
  const data = await api.files.list(f);
  folder = data.path;
  entries = data.entries;
  const parts = folder ? folder.split('/') : [];
  $('crumbs').replaceChildren(el('button', { textContent: 'Home', onclick: () => show('') }),
    ...parts.map((p, i) => el('button', { textContent: p, onclick: () => show(parts.slice(0, i + 1).join('/')) })));
  $('files').replaceChildren(...entries.map((e) => {
    const li = el('li', {}, el('span', { className: 'icon', textContent: e.type === 'dir' ? '📁' : isMidi(e.name) ? '🎵' : '📄' }), el('span', { className: 'name', textContent: e.name }));
    li.addEventListener('click', () => (e.type === 'dir' ? show(e.path) : choose(e.path)));
    if (chosen === e.path) li.classList.add('selected');
    return li;
  }));
  api.state.set('simplug', { folder, chosen }).catch(() => {});
}

function choose(path) {
  chosen = path;
  $('chosen').textContent = path;
  $('ask').disabled = false;
  $('play').classList.toggle('hidden', !isMidi(path));
  for (const li of $('files').children) li.classList.toggle('selected', li.textContent.endsWith(path.split('/').pop()));
  api.state.set('simplug', { folder, chosen }).catch(() => {});
}

async function ask() {
  if (!chosen) return;
  $('ask').disabled = true;
  try {
    const c = await commentOn(chosen);
    $('comments').prepend(el('li', { className: 'when', textContent: `${chosen} · ${new Date().toLocaleTimeString()}` }), ...c.lines.map((l) => el('li', { textContent: l })));
    lastTopic = c.topic;
    $('glOffer').classList.toggle('hidden', !c.offerGL);
    $('runGL').textContent = `Run Grammar Logic on “${c.topic}”`;
    character?.say(c.speech);
  } catch (err) {
    $('comments').prepend(el('li', { textContent: err.message }));
  } finally {
    $('ask').disabled = false;
  }
}

// Grammar Logic runs on the LucianOS desktop.
function runGL(topic) {
  if (window.parent !== window) window.parent.postMessage({ type: 'lucianos.gl', topic }, location.origin);
  else window.open(`/?gl=${encodeURIComponent(topic)}`, '_blank');
}

$('ask').addEventListener('click', ask);
$('runGL').addEventListener('click', () => runGL(lastTopic));
$('play').addEventListener('click', async () => {
  if (player) {
    player.stop();
    player = null;
    $('play').textContent = '▶ Play';
    return;
  }
  const res = await fetch(api.files.rawUrl(chosen), { credentials: 'same-origin' });
  player = playMidi(parseMidi(new Uint8Array(await res.arrayBuffer())));
  $('play').textContent = '■ Stop';
  player.done.then(() => { player = null; $('play').textContent = '▶ Play'; });
});

// The desktop can send a file to comment on: { type: 'simplug.open', path }
addEventListener('message', async (e) => {
  if (e.origin !== location.origin || e.data?.type !== 'simplug.open' || typeof e.data.path !== 'string') return;
  await show(e.data.path.split('/').slice(0, -1).join('/')).catch(() => {});
  choose(e.data.path);
  ask();
});

async function init() {
  const saved = (await api.state.get('simplug').catch(() => null)) ?? {};
  const fromUrl = new URLSearchParams(location.search).get('open');
  const start = fromUrl ? fromUrl.split('/').slice(0, -1).join('/') : saved.folder ?? '';
  await show(start).catch(() => show(''));
  if (fromUrl) {
    choose(fromUrl);
    ask();
  } else if (saved.chosen) choose(saved.chosen);
  character = await mountCharacter({
    greeting: 'Choose a file and ask what I think, or say: comment on, then a file name.',
    handle: async (cmd) => {
      if (cmd.intent === 'comment') {
        const hit = bestMatch(cmd.name, entries.filter((e) => e.type === 'file'));
        if (!hit) return `I can't see ${cmd.name} here.`;
        choose(hit.path);
        const c = await commentOn(hit.path);
        $('comments').prepend(...c.lines.map((l) => el('li', { textContent: l })));
        lastTopic = c.topic;
        $('glOffer').classList.toggle('hidden', !c.offerGL);
        $('runGL').textContent = `Run Grammar Logic on “${c.topic}”`;
        return c.speech;
      }
      if (cmd.intent === 'gl' && (cmd.topic || lastTopic)) {
        runGL(cmd.topic || lastTopic);
        return `Starting Grammar Logic on ${cmd.topic || lastTopic}.`;
      }
      return null;
    }
  }).catch(() => null);
}

init();
