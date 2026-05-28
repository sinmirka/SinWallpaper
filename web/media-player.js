/* sinpaper -- Media Player */

var mediaOut = document.getElementById('media-output');
var thumbCanvas = document.getElementById('thumb-canvas');

var mediaState = {
  title:    '',
  artist:   '',
  album:    '',
  duration: 0,
  position: 0,
  playing:  false,
  thumbAscii: '',
  haveThumb: false
};

function fmtTime(s) {
  if (!s || s <= 0) return '00:00';
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function thumbToAscii(img, w) {
  thumbCanvas.width = w;
  thumbCanvas.height = w;
  var ctx = thumbCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, w);
  var data = ctx.getImageData(0, 0, w, w).data;
  var chars = '@%#*+=-:. ';
  var out = '';
  for (var y = 0; y < w; y++) {
    for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      var gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
      var idx = Math.floor(gray / 256 * chars.length);
      out += chars[Math.min(idx, chars.length - 1)];
    }
    if (y < w - 1) out += '\n';
  }
  return out;
}

// API listeners
if (window.wallpaperRegisterMediaPropertiesListener) {
  window.wallpaperRegisterMediaPropertiesListener(function(props) {
    if (props.title !== undefined)    mediaState.title = props.title;
    if (props.artist !== undefined)   mediaState.artist = props.artist;
    if (props.album !== undefined)    mediaState.album = props.album;
    if (props.duration !== undefined) mediaState.duration = props.duration;
    doRender();
  });
} else {
  mediaState.title = 'Wallpaper Engine';
  mediaState.artist = 'Media API not available';
}

if (window.wallpaperRegisterMediaPlaybackListener) {
  window.wallpaperRegisterMediaPlaybackListener(function(pb) {
    if (pb.position !== undefined) mediaState.position = pb.position;
    if (pb.state !== undefined)    mediaState.playing = (pb.state === 'playing');
    doRender();
  });
}

if (window.wallpaperRegisterMediaThumbnailListener) {
  window.wallpaperRegisterMediaThumbnailListener(function(thumbData) {
    var img = new Image();
    img.onload = function() {
      mediaState.thumbAscii = thumbToAscii(img, 28);
      mediaState.haveThumb = true;
      doRender();
    };
    img.src = thumbData;
  });
}

// render
function doRender() {
  var playing = mediaState.playing;
  var statusColor = playing ? '#8fbc8f' : '#b9a04a';
  var statusText = playing ? 'PLAYING' : 'PAUSED';
  var elapsed = fmtTime(mediaState.position);
  var total = mediaState.duration > 0 ? fmtTime(mediaState.duration) : '--:--';

  // progress
  var pct = 0;
  if (mediaState.duration > 0 && mediaState.position > 0) {
    pct = Math.min(100, (mediaState.position / mediaState.duration) * 100);
  }
  var barLen = 38;
  var filled = Math.round(pct / 100 * barLen);
  var empty = barLen - filled;

  var bar = '[';
  for (var i = 0; i < barLen; i++) {
    bar += (i < filled) ? '#' : '.';
  }
  bar += ']';

  var html = '';
  var sep = '------------------------------------------------------------------';

  // header
  html += '<div class="media-dim">' + sep + '</div>';
  html += '<div class="media-bright">  NOW PLAYING</div>';
  html += '<div class="media-dim">' + sep + '</div>';
  html += '<div class="media-line"> </div>';

  // status
  html += '<div class="media-line">  <span style="color:' + statusColor + '">> ' + statusText + '</span></div>';
  html += '<div class="media-line"> </div>';

  // ASCII cover
  if (mediaState.haveThumb && mediaState.thumbAscii) {
    var lines = mediaState.thumbAscii.split('\n');
    for (var j = 0; j < lines.length; j++) {
      if (lines[j].length > 0) {
        html += '<div class="media-pthumb">     ' + lines[j] + '</div>';
      }
    }
  } else if (playing) {
    html += '<div class="media-pthumb">     +----------------------------+</div>';
    html += '<div class="media-pthumb">     |                            |</div>';
    html += '<div class="media-pthumb">     |                            |</div>';
    html += '<div class="media-pthumb">     |       <no cover>           |</div>';
    html += '<div class="media-pthumb">     |                            |</div>';
    html += '<div class="media-pthumb">     |                            |</div>';
    html += '<div class="media-pthumb">     +----------------------------+</div>';
  }
  html += '<div class="media-line"> </div>';

  // track info
  html += '<div class="media-line">  <span class="media-label">Artist         </span><span class="media-value">' + (mediaState.artist || 'Unknown') + '</span></div>';
  html += '<div class="media-line">  <span class="media-label">Track          </span><span class="media-value">' + (mediaState.title || 'Unknown') + '</span></div>';
  if (mediaState.album) {
    html += '<div class="media-line">  <span class="media-label">Album          </span><span class="media-value">' + mediaState.album + '</span></div>';
  }
  html += '<div class="media-line">  <span class="media-label">Status         </span><span class="media-value">' + (playing ? 'Playing' : 'Paused') + '</span></div>';
  html += '<div class="media-line">  <span class="media-label">Position       </span><span class="media-value">' + elapsed + ' / ' + total + '</span></div>';
  html += '<div class="media-line"> </div>';

  // progress
  html += '<div class="media-line">  Progress      ' + bar;
  html += '<div class="media-line"> </div>';
  html += '<div class="media-dim">' + sep + '</div>';

  mediaOut.innerHTML = html;
}

// initial
doRender();

// tick
setInterval(function() {
  if (mediaState.playing) {
    mediaState.position += 1;
    doRender();
  }
}, 1000);