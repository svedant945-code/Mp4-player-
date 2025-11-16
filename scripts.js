const videoPlayer = document.getElementById('videoPlayer');
const videoSource = document.getElementById('videoSource');
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resolutionSelect = document.getElementById('resolutionSelect');
const currentResolutionEl = document.getElementById('currentResolution');
const videoStatus = document.getElementById('videoStatus');

function setPlayLabel() {
  playPauseBtn.textContent = videoPlayer.paused ? 'Play' : 'Pause';
}

playPauseBtn.addEventListener('click', () => {
  if (videoPlayer.paused) videoPlayer.play();
  else videoPlayer.pause();
  setPlayLabel();
});

videoPlayer.addEventListener('play', setPlayLabel);
videoPlayer.addEventListener('pause', setPlayLabel);
videoPlayer.addEventListener('waiting', () => videoStatus.textContent = 'Buffering...');
videoPlayer.addEventListener('playing', () => videoStatus.textContent = 'Playing');

stopBtn.addEventListener('click', () => {
  videoPlayer.pause();
  videoPlayer.currentTime = 0;
  setPlayLabel();
});

// Download uses the currently selected source
downloadBtn.addEventListener('click', () => {
  const src = videoPlayer.currentSrc || videoSource.src;
  if (!src) return alert('No video source available to download.');
  const a = document.createElement('a');
  a.href = src;
  // filename based on resolution
  const res = resolutionSelect.options[resolutionSelect.selectedIndex].value;
  a.download = `video_${res}p.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});

// Switch resolution without losing currentTime (best-effort)
async function switchResolution(newSrc, newLabel) {
  try {
    const wasPlaying = !videoPlayer.paused;
    const currentTime = videoPlayer.currentTime;
    // swap source
    videoSource.src = newSrc;
    videoPlayer.pause();
    videoPlayer.load(); // force reload
    // try to seek to same time after metadata loaded
    videoPlayer.addEventListener('loadedmetadata', function restoreTime() {
      if (videoPlayer.duration && currentTime < videoPlayer.duration) {
        videoPlayer.currentTime = currentTime;
      }
      videoPlayer.removeEventListener('loadedmetadata', restoreTime);
      if (wasPlaying) videoPlayer.play().catch(()=>{/* autoplay may be blocked */});
    });
    currentResolutionEl.textContent = `${newLabel}`;
    videoStatus.textContent = 'Switched resolution';
    setTimeout(()=> videoStatus.textContent = '', 1500);
  } catch (err) {
    console.error('Resolution switch failed', err);
    videoStatus.textContent = 'Switch failed';
  }
}

resolutionSelect.addEventListener('change', (e) => {
  const opt = resolutionSelect.selectedOptions[0];
  const src = opt.dataset.src;
  const label = opt.textContent;
  if (!src) return;
  // If same source, do nothing
  if (videoPlayer.currentSrc && videoPlayer.currentSrc.includes(src)) return;
  switchResolution(src, label);
});

// initialize UI with selected resolution
(function init() {
  const opt = resolutionSelect.selectedOptions[0];
  if (opt && opt.dataset.src) {
    videoSource.src = opt.dataset.src;
    currentResolutionEl.textContent = opt.textContent;
    videoPlayer.load();
  }
  setPlayLabel();
})();