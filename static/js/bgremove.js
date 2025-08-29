const form = document.getElementById("uploadForm");
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const originalImage = document.getElementById("originalImage");
const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");
const bgColorOptions = document.getElementById("bgColorOptions");
const colorGrid = document.getElementById("colorGrid");
const loaderOverlay = document.getElementById("loaderOverlay");

// Store the original filename
let uploadedFileName = "";

// -------------------- Loader --------------------
function showLoader() {
  loaderOverlay.style.display = "flex";
}
function hideLoader() {
  loaderOverlay.style.display = "none";
}

// -------------------- Default Colors --------------------
const presetColors = [
  "#FFFFFF",
  "#F44336",
  "#E91E63",
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFEB3B",
  "#FFC107",
  "#FF9800",
  "#FF5722",
  "#795548",
  "#9E9E9E",
  "#607D8B",
  "#000000",
];

let selectedBgColor = "transparent";

// -------------------- Color Grid --------------------
function initColorGrid() {
  colorGrid.innerHTML = "";

  // 1. Remove BG Button
  const removeBtn = document.createElement("button");
  removeBtn.className =
    "color-btn rounded border d-flex align-items-center justify-content-center";
  removeBtn.style.width = "32px";
  removeBtn.style.height = "32px";
  removeBtn.title = "Remove BG";
  removeBtn.innerHTML = "✂️";
  removeBtn.onclick = removeBgFromPreview;
  colorGrid.appendChild(removeBtn);

  // 2. Color Picker
  const picker = document.createElement("input");
  picker.type = "color";
  picker.id = "customColor";
  picker.className = "form-control form-control-color ms-2";
  picker.value = "#ffffff";
  picker.title = "Pick a color";
  picker.addEventListener("input", (e) => setBgColor(e.target.value));
  colorGrid.appendChild(picker);

  // 3. Preset Colors
  presetColors.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "color-btn rounded border";
    btn.style.width = "32px";
    btn.style.height = "32px";
    btn.style.background = color;
    btn.title = color;
    btn.onclick = () => setBgColor(color);
    colorGrid.appendChild(btn);
  });
}

function setBgColor(color) {
  selectedBgColor = color;
  if (color === "transparent") {
    previewImage.parentElement.classList.add("checkerboard");
    previewImage.parentElement.style.background = "";
  } else {
    previewImage.parentElement.classList.remove("checkerboard");
    previewImage.parentElement.style.background = color;
  }

  const picker = document.getElementById("customColor");
  if (picker) picker.value = color === "transparent" ? "#ffffff" : color;
}

function resetBackground() {
  selectedBgColor = "transparent";
  previewImage.parentElement.classList.add("checkerboard");
  previewImage.parentElement.style.background = "";
  const picker = document.getElementById("customColor");
  if (picker) picker.value = "#ffffff";
}

initColorGrid();

// -------------------- File Input & Drag & Drop --------------------
imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) {
    uploadedFileName = imageInput.files[0].name;
    form.requestSubmit();
  }
});

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});

dropArea.addEventListener("dragleave", () =>
  dropArea.classList.remove("dragover")
);

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    imageInput.files = e.dataTransfer.files;
    uploadedFileName = file.name;
    form.requestSubmit();
  }
});

// -------------------- Form Submit --------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = imageInput.files[0];
  const formData = new FormData();
  formData.append("image", file);

  const reader = new FileReader();
  reader.onload = (e) => (originalImage.src = e.target.result);
  reader.readAsDataURL(file);

  showLoader();
  previewContainer.style.display = "none";
  downloadBtn.style.display = "none";
  bgColorOptions.style.display = "none";

  try {
    const res = await fetch("/remove-bg", { method: "POST", body: formData });
    const data = await res.json();

    previewImage.src = data.preview;
    previewContainer.style.display = "flex";

    // Use original filename + "_removebg.png" for download
    const nameWithoutExt = uploadedFileName.replace(/\.[^/.]+$/, "");
    downloadLink.href = `/results/bgremove/${data.filename}`;
    downloadLink.dataset.downloadName = `${nameWithoutExt}_removebg.png`;

    downloadBtn.style.display = "flex";
    bgColorOptions.style.display = "flex";
    previewContainer.scrollIntoView({ behavior: "smooth" });

    resetBackground();
  } catch {
    alert("Error removing background.");
  } finally {
    hideLoader();
  }
});

// -------------------- Remove BG from Current Preview --------------------
async function removeBgFromPreview() {
  if (!originalImage.src) return;
  showLoader();
  try {
    const resFetch = await fetch(originalImage.src);
    const blob = await resFetch.blob();
    const file = new File([blob], uploadedFileName, { type: "image/png" });

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/remove-bg", { method: "POST", body: formData });
    const data = await res.json();

    previewImage.src = data.preview;
    downloadLink.href = `/results/bgremove/${data.filename}`;
    downloadLink.dataset.downloadName = `${uploadedFileName.replace(
      /\.[^/.]+$/,
      ""
    )}_removebg.png`;

    resetBackground();
  } catch {
    alert("Error removing background.");
  } finally {
    hideLoader();
  }
}

// -------------------- Download --------------------
downloadLink.addEventListener("click", async function (e) {
  e.preventDefault();
  showLoader();
  try {
    const filename = downloadLink.href.split("/").pop();
    const downloadName = downloadLink.dataset.downloadName || filename;

    const res = await fetch("/download-bg-color", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: filename, color: selectedBgColor }),
    });
    if (!res.ok) throw new Error("Failed to download colored image");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName; // original filename + _removebg
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    alert("Error downloading colored image.");
  } finally {
    hideLoader();
  }
});
