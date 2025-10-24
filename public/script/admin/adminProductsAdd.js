import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const formSubmit = document.querySelector("#products form");
const variantsContainer = document.querySelector("#products #variantsContainer");
const addVariantBtn = document.querySelector("#products #addVariantBtn");

const cropperModal = document.getElementById("imageCropperModal");
const cropperImageElement = document.getElementById("cropperImage");
const cropSaveBtn = document.getElementById("cropSaveBtn");
const cropCancelBtn = document.getElementById("cropCancelBtn");

let currentCropper = null;
let currentFileInput = null; 
let currentPreviewWrapper = null; 


let variantIndex =
	variantsContainer.children.length > 0 ? variantsContainer.children.length - 1 : -1;
if (variantIndex === -1) variantIndex = 0; 

const dataURLtoFile = (dataurl, filename) => {
	const arr = dataurl.split(",");
	const mime = arr[0].match(/:(.*?);/)[1];
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, { type: mime });
};

addVariantBtn.addEventListener("click", (e) => {
	variantIndex++;
	const div = document.createElement("div");
	div.classList.add("variant-card");
	div.dataset.variantIndex = variantIndex; 

	const varintHtml = `
        <h1>Variant <span class="variant-index-display">${variantIndex + 1}</span></h1>
        <div class="variant-input-container">
          <div class="input-container preview-container">
            <label for="variants[${variantIndex}][image]">Images <span>( Only 4 Images are allowed )</span></label>
            <input type="file" name="variants[${variantIndex}][image]" id="variants[${variantIndex}][image]" multiple accept="image/*" class="variant-image-input" style="display: none;">
            <label for="variants[${variantIndex}][image]" class="preview upload-trigger">
              <i data-lucide="circle-plus" class="upload-icon"></i>
            </label>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][price]">Price</label>
            <input type="number" name="variants[${variantIndex}][price]" id="variants[${variantIndex}][price]" placeholder="e.g., 50.00" value="" min="0" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][discountedPrice]">Discounted Price <span class="optional">(Optional)</span></label>
            <input type="number" name="variants[${variantIndex}][discountedPrice]" id="variants[${variantIndex}][discountedPrice]" placeholder="e.g., 40.00" value="" min="0">
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][color]">Color</label>
            <input type="text" name="variants[${variantIndex}][color]" id="variants[${variantIndex}][color]" placeholder="e.g., Red or #FF0000" value="" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][sizes]">Sizes</label>
            <input type="text" name="variants[${variantIndex}][sizes]" id="variants[${variantIndex}][sizes]" placeholder="e.g., S, M, L, XL (comma separated)" value="" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][stock]">Stock Quantity</label>
            <input type="number" name="variants[${variantIndex}][stock]" id="variants[${variantIndex}][stock]" placeholder="Enter number of units in stock" value="" min="0" required>
          </div>
        </div>
        `;
	div.innerHTML = varintHtml.trim(); 
	variantsContainer.append(div);
	if (typeof lucide !== "undefined" && lucide.createIcons) {
		lucide.createIcons();
	}
});

variantsContainer.addEventListener("change", async (e) => {
	if (e.target.classList.contains("variant-image-input")) {
		const input = e.target;
		const files = input.files;
		const previewLabel = input.nextElementSibling;

		previewLabel.innerHTML = "";
		previewLabel.classList.remove("imageActive");
		previewLabel.innerHTML = '<i data-lucide="circle-plus" class="upload-icon"></i>';
		if (typeof lucide !== "undefined" && lucide.createIcons) {
			lucide.createIcons();
		}

		const maxFiles = 4;
		const filesToProcess = Array.from(files).slice(0, maxFiles);

		if (filesToProcess.length === 0) {
			return;
		}

		previewLabel.innerHTML = "";
		previewLabel.classList.add("imageActive");

		const dataTransfer = new DataTransfer();

		for (const file of filesToProcess) {
			if (!file.type.startsWith("image/")) {
				await Swal.fire({
					icon: "error",
					title: "Not an Image?",
					text: "Please select only image files",
					showConfirmButton: false,
					timer: 2000,
				});
				input.value = "";
				previewLabel.innerHTML = '<i data-lucide="circle-plus" class="upload-icon"></i>';
				lucide.createIcons();
				return;
			}

			dataTransfer.items.add(file);

			const div = document.createElement("div");
			div.classList.add("preview-image-wrapper");
			div.dataset.fileName = file.name;

			const reader = new FileReader();
			reader.onload = (event) => {
				const img = `<img src="${event.target.result}" alt="preview image" data-original-src="${event.target.result}"/>`;
				div.innerHTML = img;
				previewLabel.append(div);
			};
			reader.readAsDataURL(file);
		}

		input.files = dataTransfer.files;
	}
});

variantsContainer.addEventListener("click", (e) => {
	const clickedImageWrapper = e.target.closest(".preview-image-wrapper");

	if (clickedImageWrapper && clickedImageWrapper.closest("label.preview.imageActive")) {
		e.preventDefault();
		e.stopPropagation();

		const imgElement = clickedImageWrapper.querySelector("img");

		currentPreviewWrapper = clickedImageWrapper;
		const imgSrc = imgElement.src;
		currentFileInput = clickedImageWrapper
			.closest(".preview-container")
			.querySelector(".variant-image-input");

		cropperImageElement.src = imgSrc;
		cropperModal.style.display = "flex";

		if (currentCropper) {
			currentCropper.destroy();
		}
		setTimeout(() => {
			currentCropper = new Cropper(cropperImageElement, {
				aspectRatio: 1 / 1, 
				viewMode: 1,
			});
		}, 100);
	}
});

cropSaveBtn.addEventListener("click", () => {
	if (!currentCropper || !currentFileInput || !currentPreviewWrapper) return;

	const canvas = currentCropper.getCroppedCanvas();
	const croppedDataURL = canvas.toDataURL("image/png");

	const previewWrapper = currentPreviewWrapper;
	const previewImg = previewWrapper.querySelector("img");

	if (previewImg) {
		previewImg.src = croppedDataURL;
	}

	const originalFileName = previewWrapper.dataset.fileName;
	const croppedFile = dataURLtoFile(croppedDataURL, originalFileName);
	const existingFiles = Array.from(currentFileInput.files);
	const dataTransfer = new DataTransfer();
	let fileFoundAndReplaced = false;

	for (const file of existingFiles) {
		if (file.name === originalFileName && !fileFoundAndReplaced) {
			dataTransfer.items.add(croppedFile);
			fileFoundAndReplaced = true;
		} else {
			dataTransfer.items.add(file);
		}
	}

	currentFileInput.files = dataTransfer.files;

	currentCropper.destroy();
	currentCropper = null;
	currentFileInput = null;
	currentPreviewWrapper = null;
	cropperModal.style.display = "none";
});


cropCancelBtn.addEventListener("click", () => {
	if (currentCropper) {
		currentCropper.destroy();
		currentCropper = null;
		currentFileInput = null;
		currentPreviewWrapper = null;
	}
	cropperModal.style.display = "none";
});


formSubmit.addEventListener("submit", async (e) => {
	e.preventDefault();
	const formData = new FormData(formSubmit);
	Swal.fire({
		title: "Processing...",
		text: "Please wait while we upload the image.",
		icon: "info",
		allowOutsideClick: false,
		showConfirmButton: false,
		willOpen: () => {
			Swal.showLoading();
		},
	});

	try {
		const res = await fetch("/admin/products/action", {
			method: "POST",
			body: formData,
		});
		const result = await res.json();

		if (!res.ok || !result.success) {
			Swal.close();
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: result.message || "Something went wrong. Please try again.",
				customClass: { confirmButton: "custom-confirm-btn" },
				buttonsStyling: false,
			});
			return;
		}
		Swal.close();
		await Swal.fire({
			icon: "success",
			title: "Product Created!",
			text: result.message || "Your information has been saved successfully.",
			showConfirmButton: false,
			timer: 1500,
		});
		formSubmit.reset();
		window.location.pathname = "/admin/products/";
	} catch (err) {
		Swal.close();
		console.log("Error :", err);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while saving the information.",
			confirmButtonColor: "#d33",
		});
	}
});
