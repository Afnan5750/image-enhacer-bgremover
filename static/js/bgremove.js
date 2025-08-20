const form = document.getElementById("uploadForm");
const dropArea = document.getElementById("dropArea");
const imageInput = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const previewImage = document.getElementById("previewImage");
const originalImage = document.getElementById("originalImage");
const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");

// Loader Overlay
const loaderOverlay = document.getElementById("loaderOverlay");

function showLoader() {
  loaderOverlay.style.display = "flex";
}
function hideLoader() {
  loaderOverlay.style.display = "none";
}

imageInput.addEventListener("change", () => {
  if (imageInput.files.length > 0) form.requestSubmit();
});

// Drag & drop
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
    form.requestSubmit();
  }
});

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
  downloadBtn.style.display = "none"; // hide before processing

  try {
    const res = await fetch("/remove-bg", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    previewImage.src = data.preview;
    previewContainer.style.display = "flex";

    // Show download button after success
    downloadLink.href = `/results/bgremove/${data.filename}`;
    downloadBtn.style.display = "flex";

    previewContainer.scrollIntoView({ behavior: "smooth" });
  } catch {
    alert("Error removing background.");
  } finally {
    hideLoader();
  }
});
