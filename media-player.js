/* ══════════════════════════════════════════════════════════════
   sinpaper  —  Media Player (Wallpaper Engine Media API)
   ──────────────────────────────────────────────────────────────
   Requires:  Wallpaper Engine with Media Integration enabled
   API:       wallpaperRegisterMediaPropertiesListener
              wallpaperRegisterMediaPlaybackListener
              wallpaperRegisterMediaThumbnailListener
   ══════════════════════════════════════════════════════════════ */

const mediaOut = document.getElementById('media-output');
const thumbCanvas = document.getElementById('thumb-canvas');

/* ── state ─────────────────────────────────────────────────── */
const state = {
  title:    '',
  artist:   '',
  album:    '',
  duration: 0,
  position: 0,
  playing:  false,
  thumbnail: null,
  colors:   { primary: '#fff', text: '#fff', highContrast: '#fff' },
  thumbAscii: '',
  dirtyThumb: true,
};

/* ── ASCII char set (dark → light) ─────────────────────────── */
const ASCII_CHARS = '@%#*+=-:. ';

function fmtTime(sec) {
  if (!sec || sec <= 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ── convert thumbnail → ASCII art ─────────────────────────── */
function thumbnailToAscii(img, width) {
  thumbCanvas.width  = width;
  thumbCanvas.height = Math.round(width); // square
  const ctx = thumbCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, width, thumbCanvas.height);

  const data = ctx.getImageData(0, 0, width, thumbCanvas.height).data;
  let ascii = '';
  for (let y = 0; y < thumbCanvas.height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const idx = Math.floor(gray / 256 * ASCII_CHARS.length);
      ascii += ASCII_CHARS[Math.min(idx, ASCII_CHARS.length - 1)];
    }
    ascii += '\n';
  }
  return ascii;
}

/* ── register API listeners ────────────────────────────────── */
if (window.wallpaperRegisterMediaPropertiesListener) {
  window.wallpaperRegisterMediaPropertiesListener((props) => {
    if (props.title !== undefined)       state.title    = props.title;
    if (props.artist !== undefined)      state.artist   = props.artist;
    if (props.album !== undefined)       state.album    = props.album;
    if (props.duration !== undefined)    state.duration = props.duration;
    if (props.primaryColor !== undefined)    state.colors.primary    = '#' + props.primaryColor.toString(16).padStart(6,'0');
    if (props.textColor !== undefined)       state.colors.text       = '#' + props.textColor.toString(16).padStart(6,'0');
    if (props.highContrastColor !== undefined) state.colors.highContrast = '#' + props.highContrastColor.toString(16).padStart(6,'0');
    renderMedia();
  });
} else {
  state.title = 'Wallpaper Engine';
  state.artist = 'Media API not detected';
}

if (window.wallpaperRegisterMediaPlaybackListener) {
  window.wallpaperRegisterMediaPlaybackListener((pb) => {
    if (pb.position !== undefined)  state.position = pb.position;
    if (pb.state !== undefined) {
      state.playing = (pb.state === 'playing');
    }
    renderMedia();
  });
}

if (window.wallpaperRegisterMediaThumbnailListener) {
  window.wallpaperRegisterMediaThumbnailListener((thumbData) => {
    const img = new Image();
    img.onload = () => {
      state.thumbAscii = thumbnailToAscii(img, 20);
      state.dirtyThumb = false;
      renderMedia();
    };
    img.onerror = () => { state.dirtyThumb = true; };
    img.src = thumbData;
  });
}

/* ── render ────────────────────────────────────────────────── */
let mediaBuf = [];
function m(cls, txt) { mediaBuf.push({ cls, txt }); }

const MEDIA_SEP = '------------------------------';

function renderMedia() {
  mediaBuf = [];
  const nowPlaying = state.playing ? 'PLAYING' : 'PAUSED';

  // header
  m('media-dim', MEDIA_SEP);
  m('media-bright', '  NOW PLAYING');
  m('media-dim', MEDIA_SEP);

  // status
  const statusColor = state.playing ? '#8fbc8f' : '#b9a04a';
  m('media-line', `  <span style="color:${statusColor}">\u25B6 ${nowPlaying}</span>`);

  // ASCII thumbnail
  if (state.thumbAscii && !state.dirtyThumb) {
    m('media-line', '');
    m('media-pthumb', state.thumbAscii);
    m('media-line', '');
  } else if (state.playing) {
    // placeholders when no thumbnail yet
    m('media-line', '');
    const ph = [
      '  +------------------+',
      '  |                  |',
      '  |   <no cover>     |',
      '  |                  |',
      '  +------------------+',
    ];
    for (const l of ph) m('media-pthumb', l);
    m('media-line', '');
  }

  // track info
  const title   = state.title   || 'Unknown Track';
  const artist  = state.artist  || 'Unknown Artist';
  const album   = state.album   || '';
  const elapsed = fmtTime(state.position);
  const total   = state.duration > 0 ? fmtTime(state.duration) : '--:--';

  // progress bar
  let pct = 0;
  if (state.duration > 0 && state.position > 0) {
    pct = Math.min(100, (state.position / state.duration) * 100);
  }
  const barLen = 22;
  const filled = Math.round(pct / 100 * barLen);
  const empty  = barLen - filled;

  m('media-title', `  ${title}`);
  if (artist) m('media-artist', `  ${artist}`);
  if (album)  m('media-sub',    `  \u201C${album}\u201D`);

  m('media-line', '');
  m('media-status', `  ${elapsed} / ${total}`);
  const bar = '<span class="pb-open">[</span>'
    + '<span class="pb-fill">'  + '\u2588'.repeat(filled) + '</span>'
    + '<span class="pb-empty">' + '\u2591'.repeat(empty)  + '</span>'
    + '<span class="pb-close">]</span>';
  m('media-progress', `  ${bar}  ${Math.round(pct)}%`);

  m('media-line', '');
  m('media-dim', MEDIA_SEP);

  // build DOM
  let html = '';
  for (const l of mediaBuf) {
    html += `<div class="${l.cls}">${l.txt}</div>`;
  }
  mediaOut.innerHTML = html;
}

// initial render
renderMedia();

// periodical refresh for elapsed time
setInterval(() => {
  if (state.playing) {
    state.position += 1;
    renderMedia();
  }
}, 1000);