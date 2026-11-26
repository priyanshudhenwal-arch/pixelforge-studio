const canvas = document.getElementById("editorCanvas");
const ctx = canvas.getContext("2d");

const uploadInput = document.getElementById("uploadInput");
const dropZone = document.getElementById("dropZone");
const emptyState = document.getElementById("emptyState");
const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");
const compareBtn = document.getElementById("compareBtn");
const exportFormat = document.getElementById("exportFormat");
const exportQuality = document.getElementById("exportQuality");
const qualityVal = document.getElementById("qualityVal");

const sliders = {
  brightness: document.getElementById("brightness"),
  contrast: document.getElementById("contrast"),
  saturate: document.getElementById("saturate"),
  grayscale: document.getElementById("grayscale"),
  sepia: document.getElementById("sepia"),
  hue: document.getElementById("hue"),
  blur: document.getElementById("blur"),
};

const defaultState = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
  grayscale: 0,
  sepia: 0,
  hue: 0,
  blur: 0,
  rotate: 0,
  flipH: 1,
  flipV: 1,
};

let state = { ...defaultState };
let sourceImage = null;
let isComparing = false;

const presets = {
  original: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hue: 0, blur: 0 },
  noir: { brightness: 95, contrast: 140, saturate: 0, grayscale: 100, sepia: 0, hue: 0, blur: 0 },
  vintage: { brightness: 105, contrast: 90, saturate: 85, grayscale: 0, sepia: 45, hue: 0, blur: 0 },
  warm: { brightness: 105, contrast: 108, saturate: 125, grayscale: 0, sepia: 20, hue: 350, blur: 0 },
  cool: { brightness: 102, contrast: 112, saturate: 95, grayscale: 0, sepia: 0, hue: 195, blur: 0 },
  vivid: { brightness: 104, contrast: 120, saturate: 155, grayscale: 0, sepia: 0, hue: 0, blur: 0 },
};

function updateLabels() {
  document.getElementById("brightnessVal").textContent = `${state.brightness}%`;
  document.getElementById("contrastVal").textContent = `${state.contrast}%`;
  document.getElementById("saturateVal").textContent = `${state.saturate}%`;
  document.getElementById("grayscaleVal").textContent = `${state.grayscale}%`;
  document.getElementById("sepiaVal").textContent = `${state.sepia}%`;
  document.getElementById("hueVal").textContent = `${state.hue}°`;
  document.getElementById("blurVal").textContent = `${state.blur}px`;
}

function syncSliders() {
  Object.keys(sliders).forEach((key) => {
    sliders[key].value = state[key];
  });
  updateLabels();
}

function render() {
  if (!sourceImage) return;

  const angle = ((state.rotate % 360) + 360) % 360;
  const swapDimensions = angle === 90 || angle === 270;

  canvas.width = swapDimensions ? sourceImage.height : sourceImage.width;
  canvas.height = swapDimensions ? sourceImage.width : sourceImage.height;

  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (isComparing) {
    ctx.filter = "none";
  } else {
    ctx.filter = [
      `brightness(${state.brightness}%)`,
      `contrast(${state.contrast}%)`,
      `saturate(${state.saturate}%)`,
      `grayscale(${state.grayscale}%)`,
      `sepia(${state.sepia}%)`,
      `hue-rotate(${state.hue}deg)`,
      `blur(${state.blur}px)`,
    ].join(" ");
  }

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.scale(state.flipH, state.flipV);
  ctx.drawImage(sourceImage, -sourceImage.width / 2, -sourceImage.height / 2);
  ctx.restore();
}

function loadFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      emptyState.hidden = true;
      canvas.hidden = false;
      resetBtn.disabled = false;
      downloadBtn.disabled = false;
      compareBtn.disabled = false;
      resetEditor();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function resetEditor() {
  state = { ...defaultState };
  syncSliders();
  setActivePreset("original");
  render();
}

function setActivePreset(name) {
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.preset === name);
  });
}

// Event Listeners
uploadInput.addEventListener("change", (e) => loadFile(e.target.files[0]));

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  loadFile(e.dataTransfer.files[0]);
});

Object.keys(sliders).forEach((key) => {
  sliders[key].addEventListener("input", (e) => {
    state[key] = parseFloat(e.target.value);
    updateLabels();
    setActivePreset("");
    render();
  });
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const presetName = btn.dataset.preset;
    Object.assign(state, presets[presetName]);
    syncSliders();
    setActivePreset(presetName);
    render();
  });
});

document.getElementById("rotateLeft").addEventListener("click", () => {
  state.rotate -= 90;
  render();
});

document.getElementById("rotateRight").addEventListener("click", () => {
  state.rotate += 90;
  render();
});

document.getElementById("flipH").addEventListener("click", () => {
  state.flipH *= -1;
  render();
});

document.getElementById("flipV").addEventListener("click", () => {
  state.flipV *= -1;
  render();
});

resetBtn.addEventListener("click", resetEditor);

compareBtn.addEventListener("pointerdown", () => {
  isComparing = true;
  render();
});

["pointerup", "pointerleave"].forEach((evt) => {
  compareBtn.addEventListener(evt, () => {
    if (isComparing) {
      isComparing = false;
      render();
    }
  });
});

exportQuality.addEventListener("input", (e) => {
  qualityVal.textContent = `${e.target.value}%`;
});

downloadBtn.addEventListener("click", () => {
  if (!sourceImage) return;
  const mime = exportFormat.value;
  const ext = mime.split("/")[1];
  const quality = parseInt(exportQuality.value, 10) / 100;

  const link = document.createElement("a");
  link.download = `pixelforge-edited.${ext}`;
  link.href = canvas.toDataURL(mime, quality);
  link.click();
});
