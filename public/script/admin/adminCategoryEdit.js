import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const imageInput = document.querySelector("#category form #category-image");
const previewLabel = document.querySelector("#category form .add-image-label");
const form = document.querySelector("#category.add-or-edit-category-section form");

const cropperModal = document.getElementById("imageCropperModal");
const cropperImageElement = document.getElementById("cropperImage");
const cropSaveBtn = document.getElementById("cropSaveBtn");
const cropCancelBtn = document.getElementById("cropCancelBtn");

let currentCropper = null;
let currentFile = null;

const dataURLtoFile = (dataurl, filename) => {
	const arr = dataurl.split(",");
	const mime = arr[0]
		.match(/:(.*?);/g)[0]
		.replace(":", "")
		.replace(";", "");
	const bstr = atob(arr[1]);
	let n = bstr.length;
	const u8arr = new Uint8Array(n);
	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}
	return new File([u8arr], filename, { type: mime });
};

imageInput.addEventListener("change", async (e) => {
	const file = e.target.files[0];
	if (!file) return;

	if (!file.type.startsWith("image/")) {
		await Swal.fire({
			icon: "error",
			title: "Not an Image?",
			text: "Please select an image file",
			showConfirmButton: false,
			timer: 2000,
		});
		imageInput.value = "";
		return;
	}

	currentFile = file;

	const reader = new FileReader();
	reader.onload = (event) => {
		cropperImageElement.src = event.target.result;
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
	};
	reader.readAsDataURL(file);
});

cropSaveBtn.addEventListener("click", () => {
	if (!currentCropper || !currentFile) return;

	const canvas = currentCropper.getCroppedCanvas({
		width: 400,
		height: 400,
	});
	const croppedDataURL = canvas.toDataURL("image/png");

	previewLabel.innerHTML = "";
	const img = document.createElement("img");
	img.src = croppedDataURL;
	previewLabel.append(img);

	const croppedFile = dataURLtoFile(croppedDataURL, currentFile.name);

	const dataTransfer = new DataTransfer();
	dataTransfer.items.add(croppedFile);
	imageInput.files = dataTransfer.files;

	currentCropper.destroy();
	currentCropper = null;
	currentFile = null;
	cropperModal.style.display = "none";
});

cropCancelBtn.addEventListener("click", () => {
	if (currentCropper) {
		currentCropper.destroy();
		currentCropper = null;
	}
	currentFile = null;
	cropperModal.style.display = "none";
});

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const id = form.getAttribute("data-id").trim();
	const formData = new FormData(form);

	Swal.fire({
		title: "Processing...",
		text: "Please wait while we update the category.",
		icon: "info",
		allowOutsideClick: false,
		showConfirmButton: false,
		willOpen: () => {
			Swal.showLoading();
		},
	});
	try {
		const res = await fetch(`/admin/categories/action/${id}`, {
			method: "PATCH",
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
			title: "Category Updated",
			text: result.message || "Your information has been saved successfully.",
			showConfirmButton: false,
			timer: 1500,
		});

		window.location.href = "/admin/categories/";
	} catch (err) {
		Swal.close();
		console.error("Error :", err);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while saving the information.",
			confirmButtonColor: "#d33",
		});
	}
});
