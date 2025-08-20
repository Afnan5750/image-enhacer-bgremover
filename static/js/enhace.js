const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");
const uploadForm = document.getElementById("uploadForm");
const upscaleSelect = document.getElementById("upscaleSelect");

function showLoader() {
  document.getElementById("loaderOverlay").style.display = "flex";
}

function autoSubmitIfReady() {
  if (upscaleSelect.value && imageInput.files.length > 0) {
    showLoader();
    setTimeout(() => uploadForm.submit(), 100);
  }
}

imageInput.addEventListener("change", autoSubmitIfReady);
dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropArea.classList.add("dragover");
});
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragover");
});
dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  dropArea.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    imageInput.files = e.dataTransfer.files;
    autoSubmitIfReady();
  }
});
uploadForm.addEventListener("submit", showLoader);

// Init BeerSlider if present
window.addEventListener("DOMContentLoaded", () => {
  const slider = document.getElementById("beer-slider");
  if (slider) {
    new BeerSlider(slider, { start: 50 });
  }

  // Smooth scroll to result section if it exists
  const resultSection = document.getElementById("resultSection");
  if (resultSection) {
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
