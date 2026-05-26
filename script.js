/* ══════════════════════════════════════════════════════════════
   sinpaper
   Architecture:  CONFIG → Data → LogManager → Render → Loop
   ══════════════════════════════════════════════════════════════ */

const output = document.getElementById('output');

/* ══════════════════════════════════════════════════════════════
   CONFIG  ─  static / fallback data
   ══════════════════════════════════════════════════════════════ */
const CONFIG = {
  cpuModel:    'AMD Ryzen 7 5800X 8-Core Processor',  // STATIC
  gpuModel:    'NVIDIA GeForce RTX 3060 Ti',           // STATIC
  kernel:      'Windows NT 10.0.26100',                 // STATIC
  hostname:    'sinmirka',                              // STATIC
  theme:       'sinpaper theme',                        // STATIC
  memTotalGB:  15.8,                                    // STATIC
  memUsedRatio: 0.42,                                   // STATIC
  diskTotalGB: 512,                                     // STATIC
  diskUsedRatio: 0.56,                                  // STATIC
  barLen: 20,
};

/* ══════════════════════════════════════════════════════════════
   COUNTDOWN TIMERS  ─  easy-to-edit, add as many as you want
   Each entry:
     label  – display name
     month  – 0-based (0=Jan, 11=Dec)
     day    – day of month
     hour   – hour (0-23)
   ══════════════════════════════════════════════════════════════ */
const COUNTDOWNS = [
  { label: 'Birthday',  month: 5, day: 15, hour: 0  },
  { label: 'Christmas', month: 11, day: 25, hour: 0  },
  { label: 'New Year',  month: 0,  day: 1,  hour: 0  },
];

function calcCountdown(now, cd) {
  let target = new Date(now.getFullYear(), cd.month, cd.day, cd.hour, 0, 0);
  if (target <= now) {
    target = new Date(now.getFullYear() + 1, cd.month, cd.day, cd.hour, 0, 0);
  }
  const diff = target.getTime() - now.getTime();
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  return { days, hours, mins };
}

/* ══════════════════════════════════════════════════════════════
   WORLD CLOCKS  ─  easy-to-edit, add any IANA timezone
   Each entry:
     label    – short display name
     timezone – IANA timezone string (e.g. "Europe/Paris")
   ══════════════════════════════════════════════════════════════ */
const CLOCKS = [
  { label: 'SP',       timezone: 'America/Sao_Paulo'     },
  { label: 'PARIS',    timezone: 'Europe/Paris'          },
  { label: 'EKATERIN', timezone: 'Asia/Yekaterinburg'    },
  { label: 'TOKYO',    timezone: 'Asia/Tokyo'            },
];

function getDayProgress(d) {
  const ms = d.getHours() * 3600000 + d.getMinutes() * 60000 + d.getSeconds() * 1000 + d.getMilliseconds();
  return (ms / 86400000) * 100;
}

function getRelativeDayName(localNow, tzDate) {
  const l = new Date(localNow);
  const t = new Date(tzDate);
  const ld = new Date(l.getFullYear(), l.getMonth(), l.getDate()).getTime();
  const td = new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const diffDays = Math.round((td - ld) / 86400000);
  if (diffDays === 0)  return 'Today';
  if (diffDays === 1)  return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  return tzDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtTime12(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm}`;
}

/* ══════════════════════════════════════════════════════════════
   BROWSER DETECTOR
   ══════════════════════════════════════════════════════════════ */
function detectBrowser() {
  const ua = navigator.userAgent;
  let name = 'Unknown';
  let ver  = '';
  if (ua.includes('Firefox/')) {
    name = 'Firefox';
    ver  = ua.split('Firefox/')[1]?.split('.')[0] || '';
  } else if (ua.includes('Edg/')) {
    name = 'Edge';
    ver  = ua.split('Edg/')[1]?.split('.')[0] || '';
  } else if (ua.includes('Chrome/')) {
    name = 'Chrome';
    ver  = ua.split('Chrome/')[1]?.split('.')[0] || '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name = 'Safari';
    const m = ua.match(/Version\/(\d+)/);
    ver = m ? m[1] : '';
  }
  return `${name} ${ver}`;
}

/* ══════════════════════════════════════════════════════════════
   LOG MANAGER
   ══════════════════════════════════════════════════════════════ */
const MAX_LOGS = 8;
let logs = [];
let lastFpsWarn = 0;

function addLog(type, msg) {
  const tag = type === 'warn' ? 'WARN' : 'INFO';
  logs.unshift(`[${tag}] ${msg}`);
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
}

window.addEventListener('resize', () => {
  addLog('info', `display resized:  ${window.innerWidth}x${window.innerHeight}`);
});
window.addEventListener('online',  () => addLog('info', 'network:  online'));
window.addEventListener('offline', () => addLog('warn', 'network:  offline'));
document.addEventListener('visibilitychange', () => {
  addLog('info', `tab ${document.hidden ? 'hidden' : 'visible'}`);
});

if (navigator.getBattery) {
  navigator.getBattery().then(batt => {
    batt.addEventListener('levelchange', () => {
      addLog('info', `battery:  ${Math.round(batt.level * 100)}%`);
    });
    batt.addEventListener('chargingchange', () => {
      addLog('info', `battery:  ${batt.charging ? 'charging' : 'discharging'}`);
    });
  }).catch(() => {});
}

if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    const c = navigator.connection;
    addLog('info', `network:  ${c.effectiveType || '?'}  ${c.downlink || '?'}Mbps`);
  });
}

/* ══════════════════════════════════════════════════════════════
   SYSTEM DATA
   ══════════════════════════════════════════════════════════════ */
function collectData() {
  const now   = new Date();
  const boot  = window.performance?.timing?.navigationStart || null;
  const memPct  = CONFIG.memUsedRatio * 100;
  const diskPct = CONFIG.diskUsedRatio * 100;

  return {
    now,
    dateStr: fmtDate(now),
    timeStr: fmtTime(now),
    tz:      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    locale:  navigator.language || '?',
    screenRes:  `${screen.width}x${screen.height}`,
    winSize:    `${window.innerWidth}x${window.innerHeight}`,
    aspect:     (window.innerWidth / window.innerHeight).toFixed(2),
    platform:   navigator.platform || '?',
    browser:    detectBrowser(),
    cpuCores:   navigator.hardwareConcurrency || '?',
    deviceMem:  navigator.deviceMemory ? `${navigator.deviceMemory} GiB` : '?',
    online:     navigator.onLine,
    uptime:     boot ? fmtUptime((Date.now() - boot) / 1000) : 'N/A',
    memPct, diskPct,
    fps: window.__fps || 0,
  };
}

/* ══════════════════════════════════════════════════════════════
   FPS COUNTER
   ══════════════════════════════════════════════════════════════ */
let fc = 0, lfps = performance.now();
function fpsLoop(now) {
  fc++;
  if (now - lfps >= 1000) {
    window.__fps = fc;
    if (fc < 30 && Date.now() - lastFpsWarn > 10000) {
      lastFpsWarn = Date.now();
      addLog('warn', `fps dropped:  ${fc} FPS`);
    }
    fc = 0; lfps = now;
  }
  requestAnimationFrame(fpsLoop);
}
requestAnimationFrame(fpsLoop);

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
function pad(n)  { return String(n).padStart(2, '0'); }
function pad3(n) { return String(n).padStart(3, ' '); }

function fmtTime(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmtDate(d) {
  const M = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');
  return `${d.getFullYear()}-${M[d.getMonth()]}-${pad(d.getDate())}`;
}
function fmtUptime(s) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
}

function progressBar(pct, len) {
  const filled = Math.min(Math.round(pct / 100 * len), len);
  const empty  = len - filled;
  return '<span class="pb-open">[</span>'
       + '<span class="pb-fill">'  + '\u2588'.repeat(filled) + '</span>'
       + '<span class="pb-empty">' + '\u2591'.repeat(empty)  + '</span>'
       + '<span class="pb-close">]</span>';
}

/* ══════════════════════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════════════════════ */
let buf = [];
function w(cls, txt) { buf.push({ cls, txt }); }

const SEP = '------------------------------------------------------------';

const ASCII = [
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  '                                            ',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
  'llllllllllllllllllll    llllllllllllllllllll',
];

const SYSINFO = [
  ['OS',         null],
  ['Host',       CONFIG.hostname],
  ['Kernel',     CONFIG.kernel],
  ['Uptime',     null],
  ['CPU',        CONFIG.cpuModel],
  ['GPU',        CONFIG.gpuModel],
  ['CPU Cores',  null],
  ['Device Mem', null],
  ['Memory',     null],
  ['Disk',       null],
  ['Theme',      CONFIG.theme],
  ['Terminal',   'Wallpaper Engine'],
  ['Browser',    null],
  ['Locale',     null],
];

function resolveSys(sys, label) {
  switch (label) {
    case 'OS':         return sys.platform;
    case 'Uptime':     return sys.uptime;
    case 'CPU Cores':  return `${sys.cpuCores}`;
    case 'Device Mem': return sys.deviceMem;
    case 'Memory':     return `${(CONFIG.memTotalGB * CONFIG.memUsedRatio).toFixed(1)}G / ${CONFIG.memTotalGB}G (${Math.round(sys.memPct)}%)`;
    case 'Disk':       return `${(CONFIG.diskTotalGB * CONFIG.diskUsedRatio).toFixed(0)}G / ${CONFIG.diskTotalGB}G (${Math.round(sys.diskPct)}%)`;
    case 'Browser':    return sys.browser;
    case 'Locale':     return sys.locale;
    default:           return null;
  }
}

function render() {
  buf = [];
  const sys = collectData();

  // ── header ─────────────────────────────────────────────────
  w('divider', SEP);
  w('line-bright', `  sinpaper  \u2022  ${sys.dateStr}  ${sys.timeStr}  ${sys.tz}`);
  w('divider', SEP);
  w('line', '');

  // ── ASCII + system info side by side ──────────────────────
  const infoPad = 32;
  const labelW = 11;

  const infoLines = SYSINFO.map(([label]) => {
    const val = resolveSys(sys, label);
    return `<span class="label">${label.padEnd(labelW)}</span> ${val}`;
  });

  const maxRows = Math.max(ASCII.length, infoLines.length);

  for (let i = 0; i < maxRows; i++) {
    const asciiRow = i < ASCII.length ? ASCII[i] : '';
    const infoRow  = i < infoLines.length ? infoLines[i] : '';
    const gap = asciiRow.length < infoPad ? ' '.repeat(infoPad - asciiRow.length) : '  ';
    w('line', `<span class="ascii-blue">${asciiRow}</span>${gap}${infoRow}`);
  }

  // ── sections ──────────────────────────────────────────────
  const cpuPct = 23 + Math.sin(Date.now() / 5000) * 10;
  const memPct = sys.memPct;
  const diskPct = sys.diskPct;

  // SYSTEM LOAD
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  SYSTEM LOAD');
  w('line', `    CPU   ${progressBar(cpuPct, CONFIG.barLen)}  ${pad3(Math.round(cpuPct))}%`);
  w('line', `    MEM   ${progressBar(memPct, CONFIG.barLen)}  ${pad3(Math.round(memPct))}%`);
  w('line', `    DISK  ${progressBar(diskPct, CONFIG.barLen)}  ${pad3(Math.round(diskPct))}%`);

  // COUNTDOWN TIMERS
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  COUNTDOWN TIMERS');
  for (const cd of COUNTDOWNS) {
    const { days, hours, mins } = calcCountdown(sys.now, cd);
    const label = cd.label.padEnd(12);
    const remaining = `${days}d ${pad(hours)}h ${pad(mins)}m`;
    w('line', `    <span class="label">${label}</span>  <span class="timer-val">${remaining.padStart(14)}</span> remaining`);
  }

  // WORLD CLOCKS
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  WORLD CLOCKS');
  for (const ck of CLOCKS) {
    // Build tz date parts via Intl
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ck.timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    }).formatToParts(sys.now);
    const getP = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
    const tzDate = new Date(getP('year'), getP('month') - 1, getP('day'), getP('hour'), getP('minute'), getP('second'));
    const pct = getDayProgress(tzDate);
    const dayName = getRelativeDayName(sys.now, tzDate);
    const t24 = fmtTime(tzDate);
    const t12 = fmtTime12(tzDate);
    const bar = progressBar(pct, CONFIG.barLen);
    const label = ck.label.padEnd(10);
    w('line', `    <span class="clock-label">${label}</span>` +
      ` <span class="clock-day">${dayName.padStart(9)}</span>` +
      `  <span class="clock-time24">${t24}</span>` +
      `  <span class="clock-time12">${t12.padStart(13)}</span>` +
      `  ${bar}  <span class="clock-pct">${pad3(Math.round(pct))}%</span>`);
  }

  // DISPLAY
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  DISPLAY');
  w('line', `    Resolution  ${sys.screenRes}`);
  w('line', `    Window      ${sys.winSize}  (${sys.aspect})`);
  w('line', `    FPS         ${sys.fps}`);
  w('line', `    Online      ${sys.online ? 'yes' : 'no'}`);

  // EVENTS / LOGS
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  EVENTS');
  for (const log of logs) {
    const cls = log.startsWith('[WARN]') ? 'log-warn' : 'log-info';
    w('log-line', `  <span class="${cls}">${log}</span>`);
  }

  w('line', '');
  w('divider', SEP);

  // ── build DOM ──────────────────────────────────────────────
  let html = '';
  for (const l of buf) {
    html += `<div class="${l.cls}">${l.txt}</div>`;
  }
  output.innerHTML = html;
}

/* ══════════════════════════════════════════════════════════════
   LOOP
   ══════════════════════════════════════════════════════════════ */
let last = 0;
function update(ts) {
  if (ts - last >= 1000) { last = ts; render(); }
  requestAnimationFrame(update);
}

render();
requestAnimationFrame(update);

addLog('info', `session started  \u2014  ${detectBrowser()}`);