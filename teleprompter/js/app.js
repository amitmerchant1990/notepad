const elements = {
  scriptInput: document.getElementById("scriptInput"),
  prompterContent: document.getElementById("prompterContent"),
  prompterStage: document.getElementById("prompterStage"),
  prompterFrame: document.getElementById("prompterFrame"),
  playToggle: document.getElementById("playToggle"),
  resetButton: document.getElementById("resetBtn"),
  fullscreenButton: document.getElementById("fullscreenBtn"),
  sampleButton: document.getElementById("sampleBtn"),
  wordCount: document.getElementById("wordCount"),
  speedRange: document.getElementById("speedRange"),
  speedValue: document.getElementById("speedValue"),
  fontRange: document.getElementById("fontRange"),
  fontValue: document.getElementById("fontValue"),
  lineRange: document.getElementById("lineRange"),
  lineValue: document.getElementById("lineValue"),
  widthRange: document.getElementById("widthRange"),
  widthValue: document.getElementById("widthValue"),
  mirrorToggle: document.getElementById("mirrorToggle"),
  guideToggle: document.getElementById("guideToggle"),
  startTopToggle: document.getElementById("startTopToggle"),
  bgColor: document.getElementById("bgColor"),
  textColor: document.getElementById("textColor"),
  progress: document.getElementById("scrollProgress"),
  playStatus: document.getElementById("playStatus")
};

const STORAGE_KEY = "teleprompter-state-v1";
const defaultScript = `Welcome to your teleprompter.\n\nPaste your script on the left and press Play. Adjust speed, font size, and colors to match your stage or camera setup.\n\nPro tip: keep sentences short and add pauses with blank lines.\n\nLet's make your next recording feel effortless.`;

const state = {
  speed: 60,
  fontSize: 48,
  lineHeight: 1.6,
  width: 62,
  mirror: false,
  guide: true,
  startFromTop: true,
  bgColor: "#111827",
  textColor: "#f8f9fa"
};

let animationId = null;
let lastFrameTime = null;
let isPlaying = false;
let hasStarted = false;
let saveTimeout = null;
let targetScroll = 0;
let smoothScroll = 0;

const formatNumber = (value, suffix = "") => `${Math.round(value * 10) / 10}${suffix}`;

const setStatus = (label) => {
  elements.playStatus.textContent = label;
};

const applySettings = () => {
  document.documentElement.style.setProperty("--prompter-font-size", `${state.fontSize}px`);
  document.documentElement.style.setProperty("--prompter-line-height", state.lineHeight);
  document.documentElement.style.setProperty("--prompter-width", `${state.width}ch`);
  document.documentElement.style.setProperty("--prompter-bg", state.bgColor);
  document.documentElement.style.setProperty("--prompter-text", state.textColor);

  elements.speedValue.textContent = `${formatNumber(state.speed)} px/s`;
  elements.fontValue.textContent = `${formatNumber(state.fontSize)} px`;
  elements.lineValue.textContent = formatNumber(state.lineHeight);
  elements.widthValue.textContent = `${Math.round(state.width)} ch`;

  elements.prompterFrame.classList.toggle("is-mirrored", state.mirror);
  elements.prompterStage.classList.toggle("show-guide", state.guide);
};

const updateWordCount = () => {
  const text = elements.scriptInput.value.trim();
  if (!text) {
    elements.wordCount.textContent = "0";
    return;
  }
  const words = text.split(/\s+/).filter(Boolean);
  elements.wordCount.textContent = String(words.length);
};

const updateProgress = () => {
  const maxScroll = elements.prompterFrame.scrollHeight - elements.prompterFrame.clientHeight;
  if (maxScroll <= 0) {
    elements.progress.value = 0;
    return;
  }
  const progress = (elements.prompterFrame.scrollTop / maxScroll) * 100;
  elements.progress.value = Math.min(100, Math.max(0, progress));
};

const syncContent = () => {
  const text = elements.scriptInput.value.trim();
  if (text.length === 0) {
    elements.prompterContent.textContent = "Paste or type your script to start.";
    elements.prompterContent.classList.add("is-empty");
  } else {
    elements.prompterContent.textContent = elements.scriptInput.value;
    elements.prompterContent.classList.remove("is-empty");
  }
  updateWordCount();
  updateProgress();
  hasStarted = false;
  targetScroll = elements.prompterFrame.scrollTop;
  smoothScroll = targetScroll;
  if (!isPlaying) {
    setStatus(text.length === 0 ? "Waiting for text" : "Ready");
  }
  queueSave();
};

const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  lastFrameTime = null;
};

const pause = () => {
  if (!isPlaying) return;
  isPlaying = false;
  stopAnimation();
  elements.playToggle.setAttribute("title", "Play");
  elements.playToggle.setAttribute("aria-label", "Play");
  elements.playToggle.setAttribute("aria-pressed", "false");
  document.body.classList.remove("is-playing");
  setStatus("Paused");
};

const play = () => {
  const maxScroll = elements.prompterFrame.scrollHeight - elements.prompterFrame.clientHeight;
  if (maxScroll <= 0) {
    setStatus("Add more text to scroll");
    return;
  }

  if (state.startFromTop && !hasStarted) {
    elements.prompterFrame.scrollTop = 0;
  }

  targetScroll = elements.prompterFrame.scrollTop;
  smoothScroll = targetScroll;

  isPlaying = true;
  hasStarted = true;
  elements.playToggle.setAttribute("title", "Pause");
  elements.playToggle.setAttribute("aria-label", "Pause");
  elements.playToggle.setAttribute("aria-pressed", "true");
  document.body.classList.add("is-playing");
  setStatus("Playing");
  animationId = requestAnimationFrame(step);
};

const togglePlay = () => {
  if (isPlaying) {
    pause();
    return;
  }
  play();
};

const resetScroll = () => {
  pause();
  elements.prompterFrame.scrollTop = 0;
  targetScroll = 0;
  smoothScroll = 0;
  hasStarted = false;
  updateProgress();
  setStatus("Ready");
};

const step = (timestamp) => {
  if (!isPlaying) return;
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }
  const delta = Math.min(0.05, (timestamp - lastFrameTime) / 1000);
  lastFrameTime = timestamp;

  const maxScroll = elements.prompterFrame.scrollHeight - elements.prompterFrame.clientHeight;
  targetScroll = Math.min(maxScroll, targetScroll + state.speed * delta);
  const diff = targetScroll - smoothScroll;
  smoothScroll += diff * 0.35;
  if (Math.abs(diff) < 0.08) {
    smoothScroll = targetScroll;
  }

  elements.prompterFrame.scrollTop = smoothScroll;
  updateProgress();

  if (smoothScroll >= maxScroll - 0.5) {
    pause();
    hasStarted = false;
    setStatus("Reached end");
    return;
  }

  animationId = requestAnimationFrame(step);
};

const queueSave = () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    saveState();
  }, 300);
};

const saveState = () => {
  const payload = {
    text: elements.scriptInput.value,
    settings: { ...state }
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silently ignore storage errors.
  }
};

const loadState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      elements.scriptInput.value = defaultScript;
      return;
    }
    const parsed = JSON.parse(saved);
    if (parsed?.text !== undefined) {
      elements.scriptInput.value = parsed.text;
    } else {
      elements.scriptInput.value = defaultScript;
    }
    if (parsed?.settings) {
      Object.assign(state, parsed.settings);
    }
  } catch (error) {
    elements.scriptInput.value = defaultScript;
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    elements.prompterStage.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
};

const updateFullscreenLabel = () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  document.body.classList.toggle("is-fullscreen", isFullscreen);
  const fullscreenLabel = isFullscreen ? "Exit Fullscreen" : "Fullscreen";
  elements.fullscreenButton.setAttribute("title", fullscreenLabel);
  elements.fullscreenButton.setAttribute("aria-label", fullscreenLabel);
};

const bindEvents = () => {
  elements.scriptInput.addEventListener("input", syncContent);

  elements.playToggle.addEventListener("click", togglePlay);
  elements.resetButton.addEventListener("click", resetScroll);
  elements.fullscreenButton.addEventListener("click", toggleFullscreen);

  elements.sampleButton.addEventListener("click", () => {
    elements.scriptInput.value = defaultScript;
    syncContent();
  });

  elements.speedRange.addEventListener("input", (event) => {
    state.speed = Number(event.target.value);
    applySettings();
    queueSave();
  });

  elements.fontRange.addEventListener("input", (event) => {
    state.fontSize = Number(event.target.value);
    applySettings();
    queueSave();
  });

  elements.lineRange.addEventListener("input", (event) => {
    state.lineHeight = Number(event.target.value);
    applySettings();
    queueSave();
  });

  elements.widthRange.addEventListener("input", (event) => {
    state.width = Number(event.target.value);
    applySettings();
    queueSave();
  });

  elements.mirrorToggle.addEventListener("change", (event) => {
    state.mirror = event.target.checked;
    applySettings();
    queueSave();
  });

  elements.guideToggle.addEventListener("change", (event) => {
    state.guide = event.target.checked;
    applySettings();
    queueSave();
  });

  elements.startTopToggle.addEventListener("change", (event) => {
    state.startFromTop = event.target.checked;
    queueSave();
  });

  elements.bgColor.addEventListener("input", (event) => {
    state.bgColor = event.target.value;
    applySettings();
    queueSave();
  });

  elements.textColor.addEventListener("input", (event) => {
    state.textColor = event.target.value;
    applySettings();
    queueSave();
  });

  elements.prompterFrame.addEventListener("scroll", () => {
    updateProgress();
    if (!isPlaying) {
      targetScroll = elements.prompterFrame.scrollTop;
      smoothScroll = targetScroll;
    }
  });
  document.addEventListener("fullscreenchange", updateFullscreenLabel);

  document.addEventListener("keydown", (event) => {
    if (event.target === elements.scriptInput) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      togglePlay();
    }
    if (event.key.toLowerCase() === "r") {
      resetScroll();
    }
    if (event.key.toLowerCase() === "f") {
      toggleFullscreen();
    }
  });
};

const init = () => {
  loadState();

  elements.speedRange.value = state.speed;
  elements.fontRange.value = state.fontSize;
  elements.lineRange.value = state.lineHeight;
  elements.widthRange.value = state.width;
  elements.mirrorToggle.checked = state.mirror;
  elements.guideToggle.checked = state.guide;
  elements.startTopToggle.checked = state.startFromTop;
  elements.bgColor.value = state.bgColor;
  elements.textColor.value = state.textColor;

  applySettings();
  syncContent();
  updateFullscreenLabel();
  elements.playToggle.setAttribute("title", "Play");
  elements.playToggle.setAttribute("aria-label", "Play");
  elements.fullscreenButton.setAttribute("title", "Fullscreen");
  elements.fullscreenButton.setAttribute("aria-label", "Fullscreen");
  setStatus("Ready");
  bindEvents();
};

init();
