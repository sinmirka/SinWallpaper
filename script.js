/* ══════════════════════════════════════════════════════════════
   sinpaper
   Architecture:  CONFIG → Data → LogManager → Render → Loop
   ══════════════════════════════════════════════════════════════ */

const output = document.getElementById('output');

/* ══════════════════════════════════════════════════════════════
   CONFIG  ─  static / fallback data  (browser cannot read these)
   ══════════════════════════════════════════════════════════════ */
const CONFIG = {
  // ── system info ─────────────────────────────────────────────
  motherboard:     'ASUSTeK COMPUTER INC. PRIME A320M-K',   // STATIC
  cpuModel:        'AMD Ryzen 7 5800X 8-Core Processor',    // STATIC
  cpuFreq:         '@ 4.1',                                  // STATIC
  gpuModel:        'NVIDIA GeForce RTX 3060Ti',              // STATIC
  gpuMem:          '16GB',                                    // STATIC
  osName:          'Windows 11 Pro',                          // STATIC
  kernel:          '10.0.26200.0',                            // STATIC
  hostname:        'sinmirka',                                // STATIC
  terminal:        'Windows Terminal',                        // STATIC
  packages:        '(none)',                                  // STATIC
  shellName:       'PowerShell',                              // STATIC
  memTotalGiB:     15.9,                                      // STATIC
  memUsedGiB:      '--',                                      // STATIC (no real API)
  diskTotalGiB:    446,                                       // STATIC
  diskUsedGiB:     341,                                       // STATIC
  barLen:          40,
};

/* ══════════════════════════════════════════════════════════════
   COUNTDOWN TIMERS
   ══════════════════════════════════════════════════════════════ */
const COUNTDOWNS = [
  { label: 'Birthday',  month: 5, day: 15, hour: 0 },
  { label: 'Christmas', month: 11, day: 25, hour: 0 },
  { label: 'New Year',  month: 0,  day: 1,  hour: 0 },
];

function calcCountdown(now, cd) {
  let target = new Date(now.getFullYear(), cd.month, cd.day, cd.hour, 0, 0);
  if (target <= now) {
    target = new Date(now.getFullYear() + 1, cd.month, cd.day, cd.hour, 0, 0);
  }
  const diff = target.getTime() - now.getTime();
  return {
    days:  Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
  };
}

/* ══════════════════════════════════════════════════════════════
   WORLD CLOCKS
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
  const diff = Math.round((td - ld) / 86400000);
  if (diff === 0)  return 'Today';
  if (diff === 1)  return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
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
  let name = 'Unknown', ver = '';
  if (ua.includes('Firefox/'))        { name='Firefox'; ver=ua.split('Firefox/')[1]?.split('.')[0]||''; }
  else if (ua.includes('Edg/'))       { name='Edge';    ver=ua.split('Edg/')[1]?.split('.')[0]||''; }
  else if (ua.includes('Chrome/'))    { name='Chrome';  ver=ua.split('Chrome/')[1]?.split('.')[0]||''; }
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    name='Safari'; const m=ua.match(/Version\/(\d+)/); ver=m?m[1]:'';
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
  logs.unshift(`[${type === 'warn' ? 'WARN' : 'INFO'}] ${msg}`);
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS;
}

window.addEventListener('resize', () => addLog('info', `display resized:  ${window.innerWidth}x${window.innerHeight}`));
window.addEventListener('online',  () => addLog('info', 'network:  online'));
window.addEventListener('offline', () => addLog('warn', 'network:  offline'));
document.addEventListener('visibilitychange', () => addLog('info', `tab ${document.hidden ? 'hidden' : 'visible'}`));

if (navigator.getBattery) {
  navigator.getBattery().then(batt => {
    batt.addEventListener('levelchange', () => addLog('info', `battery:  ${Math.round(batt.level*100)}%`));
    batt.addEventListener('chargingchange', () => addLog('info', `battery:  ${batt.charging ? 'charging' : 'discharging'}`));
  }).catch(() => {});
}

if (navigator.connection) {
  navigator.connection.addEventListener('change', () => {
    const c = navigator.connection;
    addLog('info', `network:  ${c.effectiveType||'?'}  ${c.downlink||'?'}Mbps`);
  });
}

/* ══════════════════════════════════════════════════════════════
   SYSTEM DATA  ─  collect real + static
   ══════════════════════════════════════════════════════════════ */
function collectData() {
  const now  = new Date();
  const boot = window.performance?.timing?.navigationStart || null;
  const arch = navigator.platform?.includes('64') ? '64 bits'
             : navigator.platform?.includes('Win') ? '64 bits'
             : '';
  const shellVer = navigator.userAgent.match(/Windows NT (\S+)/)?.[1]
                   ? `v5.1.${navigator.userAgent.match(/Windows NT (\S+)/)[1].replace(/\./g,'')}`
                   : 'unknown';

  return {
    now,
    dateStr: fmtDate(now),
    timeStr: fmtTime(now),
    tz:      Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    locale:  navigator.language || '?',
    screenRes: `${screen.width}x${screen.height}`,
    platform:  navigator.platform || '?',
    browser:   detectBrowser(),
    cpuCores:  navigator.hardwareConcurrency || '?',
    deviceMem: navigator.deviceMemory ? `${navigator.deviceMemory} GiB` : '?',
    online:    navigator.onLine,
    arch,
    shellVer,
    uptime:    boot ? fmtUptimeHuman((Date.now() - boot) / 1000) : 'N/A',
    fps:       window.__fps || 0,
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

function fmtUptimeHuman(s) {
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = Math.floor(s % 60);
  return `${hh} hours ${mm} minutes ${ss} seconds`;
}

function progressBar(pct, len) {
  const filled = Math.min(Math.round(pct / 100 * len), len);
  let html = '<span class="pb-open">[</span>';
  for (let i = 0; i < len; i++) {
    // gradient across full bar width (0 to len-1)
    const t = len > 1 ? i / (len - 1) : 0;
    if (i < filled) {
      const r = Math.round(t * 255);
      const g = Math.round((1 - t) * 255);
      html += `<span style="color:rgb(${r},${g},60)">\u2588</span>`;
    } else {
      html += '<span class="pb-empty">\u2591</span>';
    }
  }
  html += '<span class="pb-close">]</span>';
  return html;
}

/* ══════════════════════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════════════════════ */
let buf = [];
function w(cls, txt) { buf.push({ cls, txt }); }

const SEP = '-------------------------------------------------------------------------------------------------';

function render() {
  buf = [];
  const sys = collectData();

  // ── header ─────────────────────────────────────────────────
  w('divider', SEP);
  w('line-bright', `  sinpaper  \u2022  ${sys.dateStr}  ${sys.timeStr}  ${sys.tz}`);
  w('divider', SEP);
  w('line', '');

  // ── ASCII art + system info side by side ──────────────────
  const asciiRows = [
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    '                                    ',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
    'llllllllllllllll    llllllllllllllll',
  ];

  const memPct = CONFIG.memUsedGiB === '--' ? '~%' : `${Math.round(+CONFIG.memUsedGiB / CONFIG.memTotalGiB * 100)}%`;
  const labelW = 14;
  const fmt = (label, val) => `<span class="label">${label.padEnd(labelW)}</span>${val}`;
  const infoRows = [
    '  sin@sinmirka',
    '',
    fmt('OS:',        `${CONFIG.osName} [${sys.arch}]`),
    fmt('Host:',      CONFIG.hostname),
    fmt('Kernel:',    CONFIG.kernel),
    fmt('Motherboard:', CONFIG.motherboard),
    fmt('Uptime:',    sys.uptime),
    fmt('Packages:',  CONFIG.packages),
    fmt('Shell:',     `${CONFIG.shellName} ${sys.shellVer}`),
    fmt('Resolution:', sys.screenRes),
    fmt('Terminal:',  CONFIG.terminal),
    fmt('CPU:',       `${CONFIG.cpuModel} ${CONFIG.cpuFreq}`),
    fmt('GPU:',       `${CONFIG.gpuModel} ${CONFIG.gpuMem}`),
    fmt('Memory:',    `${CONFIG.memUsedGiB} / ${CONFIG.memTotalGiB} GiB (${memPct})`),
    fmt('Disk:',      `${CONFIG.diskUsedGiB} GiB / ${CONFIG.diskTotalGiB} GiB (${Math.round(CONFIG.diskUsedGiB / CONFIG.diskTotalGiB * 100)}%)`),
  ];

  const asciiW = asciiRows[0].length;
  const maxRows = Math.max(asciiRows.length, infoRows.length);
  for (let i = 0; i < maxRows; i++) {
    const left  = i < asciiRows.length ? asciiRows[i] : ' '.repeat(asciiW);
    const right = i < infoRows.length  ? infoRows[i]  : '';
    const gap = ' '.repeat(6);
    w('line', `<span class="ascii-blue">${left}</span>${gap}${right}`);
  }

  // ── sections ──────────────────────────────────────────────
  const cpuPct = 23 + Math.sin(Date.now() / 5000) * 10;
  const diskPct = CONFIG.diskUsedGiB / CONFIG.diskTotalGiB * 100;
  const memPct2  = CONFIG.memUsedGiB === '--' ? 50 : +CONFIG.memUsedGiB / CONFIG.memTotalGiB * 100;

  // SYSTEM LOAD
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  SYSTEM LOAD');
  w('line', `    CPU   ${progressBar(cpuPct, CONFIG.barLen)}  ${pad3(Math.round(cpuPct))}%`);
  w('line', `    MEM   ${progressBar(memPct2, CONFIG.barLen)}  ${pad3(Math.round(memPct2))}%`);
  w('line', `    DISK  ${progressBar(diskPct, CONFIG.barLen)}  ${pad3(Math.round(diskPct))}%`);

  // COUNTDOWN TIMERS
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  COUNTDOWN TIMERS');
  for (const cd of COUNTDOWNS) {
    const { days, hours, mins } = calcCountdown(sys.now, cd);
    w('line', `    <span class="label">${cd.label.padEnd(12)}</span>  <span class="timer-val">${(`${days}d ${pad(hours)}h ${pad(mins)}m`).padStart(14)}</span> remaining`);
  }

  // WORLD CLOCKS
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  WORLD CLOCKS');
  for (const ck of CLOCKS) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: ck.timezone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
    }).formatToParts(sys.now);
    const gp = (t) => parseInt(parts.find(p=>p.type===t)?.value||'0',10);
    const tzD = new Date(gp('year'), gp('month')-1, gp('day'), gp('hour'), gp('minute'), gp('second'));
    const pct = getDayProgress(tzD);
    w('line', `    <span class="clock-label">${ck.label.padEnd(10)}</span>` +
      ` <span class="clock-day">${getRelativeDayName(sys.now,tzD).padStart(9)}</span>` +
      `  <span class="clock-time24">${fmtTime(tzD)}</span>` +
      `  <span class="clock-time12">${fmtTime12(tzD).padStart(13)}</span>` +
      `  ${progressBar(pct, CONFIG.barLen)}  <span class="clock-pct">${pad3(Math.round(pct))}%</span>`);
  }

  // DISPLAY
  w('line', '');
  w('divider', SEP);
  w('line-dim', '  DISPLAY');
  w('line', `    FPS         ${sys.fps}`);
  w('line', `    Online      ${sys.online ? 'yes' : 'no'}`);

  // EVENTS
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
  for (const l of buf) html += `<div class="${l.cls}">${l.txt}</div>`;
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