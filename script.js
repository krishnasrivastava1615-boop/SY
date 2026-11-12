"use strict";
/* ===== DEV MODE FLAG =====
   true  = show the "Developer Mode" button and panel (testing only)
   false = all developer controls and date previews are disabled and removed. SET TO false BEFORE PUBLISHING. */
const DEV_MODE = false;

/* ===== 1. EDIT HERE: names, messages, captions ===== */
const CONFIG = {
  name: "Sakshi ji",
  musicFile: "",            // e.g. "assets/music.mp3". Leave empty to use the built-in soft melody.
  allowDevOverride: true,   // Only works on localhost / file:// — ignored on the live website. Use ?date=2026-11-12
  days: [
    { title: "The Beginning", text: ["Hi, you. ♥", "I wanted to make something that feels a little like you: warm, beautiful, and impossible to forget. So here is the first little piece of my surprise, made only for you.", "This is just the beginning. Come back tomorrow."], teaser: "Tomorrow: a few things I adore about you." },
    { title: "What Makes You Special", text: ["It's the little things about you that make you so special.", "Your smile, your way of seeing things, and the way you make even an ordinary moment feel memorable. I hope you never forget how wonderful you are.", "You deserve to feel appreciated, today and every day."], teaser: "Tomorrow: one more sleep until your day." },
    { title: "One More Sleep", text: ["One more sleep, and it's finally your day. ♥", "I hope tomorrow brings you the kind of happiness that stays, the kind of smiles that come without a reason, and moments you wish you could pause forever.", "Sleep well, birthday girl. Your final surprise is waiting at midnight."], teaser: "Tomorrow is all yours. Happy almost-birthday!" }
  ],
  birthdaySub: "Today the whole day belongs to you.",
  letter: ["There's something I hope you always know…",
    "You deserve happiness that finds you on ordinary days, love that feels safe, and a thousand reasons to smile even when life gets difficult.",
    "I'm grateful that you're part of my world. I hope this new year of your life brings you beautiful surprises, peaceful days, courage, laughter, and everything your heart has been quietly wishing for.",
    "If this little website makes you smile even once, then it has done exactly what I wanted it to do.",
    "Happy birthday, my girl. You matter more than this page could ever explain."],
  photos: [
  { src: "assets/memory-6.jpg", caption: "My favourite smile ❤️", alt: "Memory 1" },
  { src: "assets/memory-2.jpg", caption: "A beautiful moment ✨", alt: "Memory 2" },
  { src: "assets/memory-3.jpg", caption: "My favourite person 💗", alt: "Memory 3" },
  { src: "assets/memory-4.jpg", caption: "A moment to remember 🌷", alt: "Memory 4" },
  { src: "assets/memory-5.jpg", caption: "You make everything better 💕", alt: "Memory 5" },
  { src: "assets/memory-1.jpg", caption: "Forever special ♡", alt: "Memory 6" }
]
};

/* ===== 2. DATE LOGIC (all in one place) =====
   IST is UTC+5:30 with no daylight saving, so unlock moments are fixed instants.
   Stage 0 = countdown, 1-3 = daily messages (Nov 12-14), 4 = birthday (Nov 15+).
   NOTE: this is a surprise, not security. Anyone can change their device clock or read the source. */
const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const UNLOCK = [12, 13, 14, 15].map(d => Date.UTC(2026, 10, d) - IST_OFFSET_MS); // midnight IST
const devAllowed = DEV_MODE && CONFIG.allowDevOverride && ["localhost", "127.0.0.1", ""].includes(location.hostname);
const devParam = devAllowed ? new URLSearchParams(location.search).get("date") : null; // e.g. 2026-11-12 or 2026-11-12T09:00
const devTime = devParam ? Date.parse(devParam + (devParam.includes("T") ? "" : "T00:00") + "+05:30") : NaN;
const t0 = performance.now();
let preview = null; // only ever set by the dev panel, which does not run when DEV_MODE is false
const nowMs = () => preview ? preview.ms + (performance.now() - preview.at) : (isNaN(devTime) ? Date.now() : devTime + (performance.now() - t0));
const getStage = () => UNLOCK.filter(t => nowMs() >= t).length;

/* ===== 3. Helpers ===== */
const $ = id => document.getElementById(id);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const para = (arr, cls) => arr.map((t, i) => { const p = document.createElement("p"); p.textContent = t; if (cls && i === 0) p.className = cls; return p; });
let stage = -1, viewDay = 1;

/* ===== 4. Screens ===== */
function render() {
  const s = getStage();
  if (s === stage) return;
  stage = s;
  $("locked").hidden = s !== 0;
  $("day").hidden = !(s >= 1 && s <= 3);
  $("birthday").hidden = s !== 4;
  $("gallery").hidden = s === 0;
  if (s >= 1 && s <= 3) { viewDay = s; renderDay(); }
  if (s === 4) initBirthday();
}
function renderCountdown() {
  if (stage !== 0) return;
  let d = Math.max(0, UNLOCK[0] - nowMs()) / 1000;
  const v = [["Days", 86400], ["Hours", 3600], ["Minutes", 60], ["Seconds", 1]].map(([l, n]) => { const x = Math.floor(d / n); d -= x * n; return `<div><b>${String(x).padStart(2, "0")}</b><small>${l}</small></div>`; });
  $("countdown").innerHTML = v.join("");
}
function renderDay() {
  const m = CONFIG.days[viewDay - 1];
  $("dayDate").textContent = `November ${11 + viewDay} · Day ${viewDay} of 3`;
  $("dayTitle").textContent = m.title;
  $("dayText").replaceChildren(...para(m.text));
  $("dayTeaser").textContent = viewDay === stage ? m.teaser : "";
  const dots = $("dots"); dots.replaceChildren();
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button"); b.type = "button";
    b.setAttribute("aria-label", i === 5 ? "Day 5: your birthday (locked until Nov 15)" : `Day ${i}`);
    b.className = (i <= stage ? "on " : "") + (i === viewDay ? "cur" : "");
    b.disabled = i > stage || i === viewDay;
    b.addEventListener("click", () => { viewDay = i; renderDay(); });
    dots.append(b);
  }
}

/* ===== 5. Birthday ===== */
let birthdayReady = false, cutTimers = [];
const later = (fn, ms) => cutTimers.push(setTimeout(fn, ms));
const scrollTo$ = el => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
function blowCandles() {
  if ($("cake").classList.contains("out")) return;
  $("cake").classList.add("out"); $("blow").disabled = true;
  $("wishMsg").textContent = "Wish made. May it find its way to you.";
  $("cut").disabled = false;
}
function showLetter() {
  const l = $("letter"); l.replaceChildren(...para(CONFIG.letter)); l.hidden = false; l.style.animation = "in 2s ease both"; scrollTo$(l);
}
function showLove() { $("love").hidden = false; scrollTo$($("love")); confetti(200); heartTimer(350); }
function cutCake() {
  if ($("cake").classList.contains("cut")) return;
  $("cut").disabled = true; $("cake").classList.add("cut");
  later(() => { confetti(260); showLetter(); later(showLove, reduce ? 500 : 6500); }, reduce ? 0 : 1200);
}
function resetBirthday() {
  cutTimers.forEach(clearTimeout); cutTimers = [];
  $("cake").classList.remove("out", "cut"); $("blow").disabled = false; $("cut").disabled = true;
  $("wishMsg").textContent = "Close your eyes. Think of something you want most.";
  $("letter").hidden = true; $("love").hidden = true;
}
function initBirthday() {
  $("bdTitle").textContent = `Happy Birthday, ${CONFIG.name}.`;
  $("bdSub").textContent = CONFIG.birthdaySub;
  if (birthdayReady) return; birthdayReady = true;
  confetti(120); heartTimer();
  $("blow").addEventListener("click", () => { blowCandles(); $("cut").focus(); });
  $("cut").addEventListener("click", cutCake);
}

/* ===== 6. Gallery + lightbox ===== */
function initGallery() {
  CONFIG.photos.forEach(p => {
    const b = document.createElement("button"); b.type = "button"; b.className = "ph";
    const img = new Image(); img.src = p.src; img.alt = p.alt; img.loading = "lazy";
    img.addEventListener("error", () => { img.removeAttribute("src"); img.style.background = "linear-gradient(160deg,#5a1230,#2a0f24)"; });
    const c = document.createElement("span"); c.textContent = p.caption;
    b.append(img, c);
    b.addEventListener("click", () => { $("lbImg").src = img.src || ""; $("lbImg").alt = p.alt; $("lbCap").textContent = p.caption; $("lightbox").hidden = false; $("lbClose").focus(); });
    $("grid").append(b);
  });
  const close = () => { $("lightbox").hidden = true; };
  $("lbClose").addEventListener("click", close);
  $("lightbox").addEventListener("click", e => { if (e.target === $("lightbox")) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

/* ===== 7. Effects ===== */
const cv = $("fx"), cx = cv.getContext("2d"); let parts = [], raf = 0;
const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
addEventListener("resize", fit); fit();
function confetti(n) {
  if (reduce) return;
  const cols = ["#f6c9d3", "#c4577a", "#d9b779", "#fff", "#e58aa5"];
  for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2, y: innerHeight * .4, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 3, r: Math.random() * 6, s: 4 + Math.random() * 5, c: cols[i % 5], life: 160 + Math.random() * 60 });
  if (!raf) raf = requestAnimationFrame(loop);
}
function loop() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.life-- > 0);
  parts.forEach(p => { p.vy += .22; p.x += p.vx; p.y += p.vy; p.r += .15; cx.globalAlpha = Math.min(1, p.life / 40); cx.fillStyle = p.c; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore(); });
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) cx.clearRect(0, 0, cv.width, cv.height);
}
let heartInt = 0;
function heartTimer(ms = 1800) {
  clearInterval(heartInt);
  if (reduce) return;
  heartInt = setInterval(() => {
    if (document.hidden || stage === 0) return;
    const h = document.createElement("span"); h.className = "h"; h.textContent = Math.random() > .3 ? "♥" : "✦";
    h.style.cssText = `left:${Math.random() * 100}%;font-size:${10 + Math.random() * 16}px;animation-duration:${9 + Math.random() * 7}s`;
    $("hearts").append(h); setTimeout(() => h.remove(), 17000);
  }, ms);
}

/* ===== 8. Music (optional, starts only on tap) ===== */
let ac, master, timer, playing = false, audioEl;
const NOTES = [261.6, 329.6, 392, 523.3, 392, 329.6, 293.7, 349.2, 440, 523.3, 440, 349.2]; // gentle C-major arpeggio loop
function startSynth() {
  ac = ac || new (window.AudioContext || window.webkitAudioContext)();
  master = master || Object.assign(ac.createGain(), {}); master.gain.value = .12; master.connect(ac.destination);
  let i = 0;
  const tick = () => {
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = "sine"; o.frequency.value = NOTES[i % NOTES.length] / (i % 12 === 0 ? 2 : 1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.8, t + .08); g.gain.exponentialRampToValueAtTime(.001, t + 2.2);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 2.3); i++;
  };
  ac.resume(); tick(); timer = setInterval(tick, 900);
}
function setMusic(on) {
  playing = on;
  $("music").setAttribute("aria-pressed", on); $("music").setAttribute("aria-label", on ? "Pause music" : "Play music");
  $("music").firstElementChild.textContent = on ? "Pause" : "Music";
  try {
    if (CONFIG.musicFile) {
      audioEl = audioEl || Object.assign(new Audio(CONFIG.musicFile), { loop: true, volume: .35 });
      on ? audioEl.play().catch(() => { CONFIG.musicFile = ""; setMusic(true); }) : audioEl.pause();
    } else if (on) startSynth(); else { clearInterval(timer); ac && ac.suspend(); }
  } catch (e) { playing = false; }
}
$("music").addEventListener("click", () => setMusic(!playing));

/* ===== 9. Boot ===== */
initGallery(); render(); renderCountdown(); heartTimer();
setInterval(() => { render(); renderCountdown(); }, 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) { render(); renderCountdown(); } });

/* ===== 10. DEV-ONLY: Developer Mode (delete this whole section when finished) =====
   Controls live in the DEV-ONLY block of index.html. Date previews never touch the real system clock. */
(function () {
  const box = $("devTools");
  if (!DEV_MODE) { if (box) box.remove(); return; }
  if (!box) return;
  box.hidden = false;
  const IST = (d, ms = 0) => Date.UTC(2026, 10, d) - IST_OFFSET_MS + ms;
  const labels = ["Countdown (before Nov 12)", "Day 1 · Nov 12", "Day 2 · Nov 13", "Day 3 · Nov 14", "Birthday · Nov 15"];
  const status = () => { $("devStatus").textContent = (preview ? "Previewing: " : "Real date: ") + labels[getStage()]; };
  function setPreview(ms) {
    resetBirthday(); preview = ms == null ? null : { ms, at: performance.now() };
    stage = -1; render(); renderCountdown(); status(); scrollTo(0, 0);
  }
  const toBirthday = () => { if (getStage() !== 4) setPreview(IST(15)); };
  function cakeTo(level) { // 1 = candles out, 2 = cut + letter, 3 = + I LOVE YOU
    toBirthday(); blowCandles();
    if (level >= 2) { $("cake").classList.add("cut"); $("cut").disabled = true; showLetter(); }
    if (level >= 3) showLove();
  }
  const actions = {
    real: () => setPreview(null),
    watch12: () => setPreview(UNLOCK[0] - 6000),
    watch15: () => setPreview(UNLOCK[3] - 6000),
    gallery: () => { $("gallery").hidden = false; scrollTo$($("gallery")); const p = document.querySelector(".ph"); if (p) p.click(); },
    confetti: () => confetti(220),
    blow: () => { toBirthday(); blowCandles(); scrollTo$($("cake")); },
    cut: () => { toBirthday(); blowCandles(); cutCake(); },
    letter: () => cakeTo(2),
    love: () => cakeTo(3),
    resetcake: () => { toBirthday(); resetBirthday(); scrollTo$($("cake")); }
  };
  $("devToggle").addEventListener("click", () => {
    const open = $("devPanel").hidden; $("devPanel").hidden = !open; $("devToggle").setAttribute("aria-expanded", open);
  });
  $("devClose").addEventListener("click", () => { $("devPanel").hidden = true; $("devToggle").setAttribute("aria-expanded", "false"); });
  $("devPanel").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.date) setPreview(IST(+b.dataset.date));
    else if (actions[b.dataset.act]) actions[b.dataset.act]();
  });
  status(); setInterval(status, 1000);
})();
