import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const variantsContainer = document.getElementById("variantsContainer");
const addVariantBtn = document.getElementById("addVariantBtn");
let variantIndex = -1;
let variantTemplate = null;

const variantFiles = new Map();

const removeThumbnail = (thumbnailWrapper, variantCard, previewContainer) => {
	const currentFilesDt = variantFiles.get(variantCard);
	if (currentFilesDt) {
		const updatedDt = new DataTransfer();
		const fileNameToRemove = thumbnailWrapper.getAttribute("data-file-name");

		Array.from(currentFilesDt.files).forEach((existingFile) => {
			if (existingFile.name !== fileNameToRemove) {
				updatedDt.items.add(existingFile);
			}
		});

		const fileInput = variantCard.querySelector(".variant-image-input");
		fileInput.files = updatedDt.files;
		variantFiles.set(variantCard, updatedDt);

		thumbnailWrapper.remove();

		if (updatedDt.files.length === 0) {
			previewContainer.classList.remove("has-images");

			const uploadIcon = previewContainer.querySelector(".upload-icon");
			if (uploadIcon) uploadIcon.style.display = "block";
		}
	}
};

const createThumbnail = (previewContainer, file, variantCard) => {
	const thumbnailWrapper = document.createElement("div");
	thumbnailWrapper.className = "preview-thumbnail";
	thumbnailWrapper.setAttribute("data-file-name", file.name);

	const img = document.createElement("img");
	const reader = new FileReader();

	reader.onload = (e) => {
		img.src = e.target.result;
	};
	reader.readAsDataURL(file);

	const removeBtn = document.createElement("span");
	removeBtn.className = "remove-thumbnail";
	removeBtn.innerHTML = "&times;";

	removeBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		removeThumbnail(thumbnailWrapper, variantCard, previewContainer);
	});

	thumbnailWrapper.appendChild(img);
	thumbnailWrapper.appendChild(removeBtn);

	const uploadIcon = previewContainer.querySelector(".upload-icon");
	if (uploadIcon) {
		previewContainer.insertBefore(thumbnailWrapper, uploadIcon);
	} else {
		previewContainer.appendChild(thumbnailWrapper);
	}
};

const handleFileChange = (e) => {
	const fileInput = e.target;
	const variantCard = fileInput.closest(".variant-card");
	const previewLabel = variantCard.querySelector(".preview");
	const uploadIcon = previewLabel.querySelector(".upload-icon");
	const maxImages = 4;

	Array.from(previewLabel.querySelectorAll(".preview-thumbnail")).forEach((thumb) => thumb.remove());

	let currentFilesDt = new DataTransfer();

	if (fileInput.files.length > 0) {
		const filesToProcess = Array.from(fileInput.files).slice(0, maxImages);

		filesToProcess.forEach((file) => {
			currentFilesDt.items.add(file);
			createThumbnail(previewLabel, file, variantCard);
		});

		fileInput.files = currentFilesDt.files;
		variantFiles.set(variantCard, currentFilesDt);

		if (currentFilesDt.files.length > 0) {
			previewLabel.classList.remove("empty");
			previewLabel.classList.add("has-images");

			if (uploadIcon) uploadIcon.style.display = "none";
		}
	} else {
		previewLabel.classList.remove("has-images");
		if (uploadIcon) uploadIcon.style.display = "block";
		variantFiles.delete(variantCard);
	}
};

const updateVariantAttributes = (variantCard, index) => {
	const display = variantCard.querySelector(".variant-index-display");
	if (display) {
		display.textContent = index + 1;
	} else {
		const h1 = variantCard.querySelector("h1");
		if (h1) h1.textContent = `Variant ${index + 1}`;
	}

	const elements = variantCard.querySelectorAll("[name], [for], [id]");
	elements.forEach((element) => {
		const currentAttr =
			element.getAttribute("name") || element.getAttribute("id") || element.getAttribute("for");
		if (currentAttr) {
			const newAttr = currentAttr.replace(/\[\d+\]/g, `[${index}]`);

			if (element.hasAttribute("name")) {
				element.setAttribute("name", newAttr);
				if (element.tagName !== "SELECT" && (element.type === "text" || element.type === "number")) {
					element.value = "";
				} else if (element.type === "file") {
					element.value = null;
				}
			}
			if (element.hasAttribute("id")) {
				element.setAttribute("id", newAttr);
			}
			if (element.tagName === "LABEL" && element.hasAttribute("for")) {
				element.setAttribute("for", newAttr);
			}
		}
	});

	const previewLabel = variantCard.querySelector(".preview");
	if (previewLabel) {
		previewLabel.classList.remove("has-images");
		const uploadIcon = previewLabel.querySelector(".upload-icon");
		if (uploadIcon) uploadIcon.style.display = "block";
		Array.from(previewLabel.querySelectorAll(".preview-thumbnail")).forEach((thumb) =>
			thumb.remove()
		);

		previewLabel.setAttribute("for", `variants[${index}][image]`);
	}
};

const setupTemplate = () => {
	const initialVariant = variantsContainer.querySelector(".variant-card");

	if (!initialVariant) {
		console.error("Initial variant card not found. Cannot create template.");
		return;
	}

	const initialFileInput = initialVariant.querySelector('input[type="file"]');
	const initialPreviewLabel = initialVariant.querySelector(".preview");
	const initialIcon = initialPreviewLabel ? initialPreviewLabel.querySelector("i") : null;

	if (initialFileInput) {
		initialFileInput.setAttribute("id", "variants[0][image]");
		initialFileInput.classList.add("variant-image-input");
		initialFileInput.setAttribute("style", "display: none;");
		initialFileInput.setAttribute("accept", "image/*");
	}

	if (initialPreviewLabel) {
		initialPreviewLabel.classList.add("upload-trigger");
	}

	if (initialIcon) {
		initialIcon.classList.add("upload-icon");
	}

	const template = document.createElement("template");
	template.content.appendChild(initialVariant.cloneNode(true));

	initialVariant.remove();

	variantTemplate = template;
};

const addVariant = () => {
	variantIndex++;

	if (!variantTemplate) {
		console.error("Variant template is not set up.");
		return;
	}

	const newVariantContent = variantTemplate.content.cloneNode(true);
	const variantCard = newVariantContent.querySelector(".variant-card");

	updateVariantAttributes(variantCard, variantIndex);

	const fileInput = variantCard.querySelector(".variant-image-input");
	const uploadTrigger = variantCard.querySelector(".upload-trigger");

	if (uploadTrigger && fileInput) {
		uploadTrigger.addEventListener("click", (e) => {
			e.preventDefault();
			fileInput.click();
		});
	}

	if (fileInput) {
		fileInput.addEventListener("change", handleFileChange);
	}

	variantsContainer.appendChild(newVariantContent);
};

const initializeForm = () => {
	setupTemplate();
	addVariant();
};

if (addVariantBtn) {
	addVariantBtn.addEventListener("click", addVariant);
}

initializeForm();

const formSubmit = document.querySelector("#products form");

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
