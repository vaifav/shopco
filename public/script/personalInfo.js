import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const edit = document.querySelector(
	"#personal-information .form-input-container:first-child button"
);
const submit = document.querySelector(
	"#personal-information .form-input-container input[type='submit']"
);
const form = document.querySelector("#personal-information form");
const profileInput = document.querySelector("#personal-information #profile");
const profileImg = document.querySelector("#personal-information .figure label.profile-label img");

const profileLabel = document.querySelector("#personal-information .figure label.profile-label");
const cropperModal = document.getElementById("cropper-modal");
const cropImage = document.getElementById("crop-image");
const saveCropBtn = document.getElementById("save-crop-btn");
const cancelCropBtn = document.getElementById("cancel-crop-btn");
const selectNewBtn = document.getElementById("select-new-btn");
const imagePrompt = document.getElementById("image-prompt");
const cropperContainer = document.getElementById("cropper-container");

let isEditing = false;
let cropper = null;
let croppedFileBlob = null;

const initialData = {
	email: document.getElementById("email").value.trim(),
};

const initializeCropper = (imageUrl) => {
	if (cropper) {
		cropper.destroy();
		cropper = null;
	}

	cropImage.src = imageUrl;

	imagePrompt.style.display = "none";
	cropperContainer.style.display = "block";
	saveCropBtn.style.display = "inline-block";
	selectNewBtn.textContent = "Select New Image";

	setTimeout(() => {
		cropper = new Cropper(cropImage, {
			aspectRatio: 1,
			viewMode: 1,
			guides: false,
			background: false,
		});
	}, 50);
};

const resetCropperModalState = () => {
	if (cropper) {
		cropper.destroy();
		cropper = null;
	}
	cropImage.src = "";
	profileInput.value = "";

	cropperContainer.style.display = "none";
	saveCropBtn.style.display = "none";

	imagePrompt.style.display = "block";
	selectNewBtn.textContent = "Select Image";

	croppedFileBlob = null;
};

const hideCropperModal = () => {
	cropperModal.style.display = "none";
	if (cropper) {
		cropper.destroy();
		cropper = null;
	}
};

const showCropperModal = () => {
	cropperModal.style.display = "flex";

	const currentSrc = profileImg.src;
	const currentAvatarUrl = currentSrc.includes("account.svg") ? null : currentSrc;

	if (currentAvatarUrl) {
		initializeCropper(currentAvatarUrl);
	} else {
		resetCropperModalState();
	}
};

profileLabel.addEventListener("click", (e) => {
	e.preventDefault();
	showCropperModal();
});

selectNewBtn.addEventListener("click", () => {
	profileInput.value = "";
	profileInput.click();
});

edit.addEventListener("click", () => {
	isEditing = true;
	submit.disabled = false;
});

form.addEventListener("change", () => {
	isEditing = true;
	submit.disabled = false;
});

profileInput.addEventListener("change", async (e) => {
	const file = e.target.files[0];

	if (!file) {
		if (croppedFileBlob) return;

		if (!profileImg.src.includes("account.svg") && cropper) return;
		if (!cropper) resetCropperModalState();
		return;
	}

	croppedFileBlob = null;

	if (!file.type.startsWith("image/")) {
		hideCropperModal();
		await Swal.fire({
			icon: "error",
			title: "Not an Image?",
			text: "Please select an image file",
			showConfirmButton: false,
			timer: 2000,
		});
		profileInput.value = "";
		return;
	}

	const reader = new FileReader();
	reader.onload = (event) => {
		initializeCropper(event.target.result);
	};
	reader.readAsDataURL(file);
});

saveCropBtn.addEventListener("click", () => {
	if (!cropper) return;

	cropper
		.getCroppedCanvas({
			width: 256,
			height: 256,
			fillColor: "#fff",
			imageSmoothingEnabled: true,
			imageSmoothingQuality: "high",
		})
		.toBlob(
			async (blob) => {
				if (!blob) {
					await Swal.fire({ icon: "error", title: "Cropping Failed" });
					return;
				}

				const croppedFile = new File([blob], "cropped_profile.png", { type: "image/png" });
				croppedFileBlob = croppedFile;
				profileInput.value = "";

				profileImg.src = URL.createObjectURL(croppedFile);

				hideCropperModal();

				isEditing = true;
				submit.disabled = false;
			},
			"image/png",
			0.9
		);
});

cancelCropBtn.addEventListener("click", () => {
	hideCropperModal();
});

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const formData = new FormData();
	const method = isEditing ? "PATCH" : "POST";
	const url = "/personalinfo/";

	const formElements = form.querySelectorAll("input, select");
	formElements.forEach((element) => {
		if (element.name === "profile" || element.type === "submit") {
			return;
		}

		if (element.type === "radio" && !element.checked) {
			return;
		}

		formData.append(element.name, element.value);
	});

	const isProfileChanged = !!croppedFileBlob;

	if (isProfileChanged) {
		formData.append("profile", croppedFileBlob, croppedFileBlob.name);
	}

	let loadingTitle = "Saving Profile...";
	let loadingText = "Your information is being saved. Please wait.";

	if (isProfileChanged) {
		loadingTitle = "Uploading Image...";
		loadingText = "Your profile picture is being uploaded and saved.";
	}

	Swal.fire({
		title: loadingTitle,
		text: loadingText,
		icon: "info",
		allowOutsideClick: false,
		showConfirmButton: false,
		willOpen: () => {
			Swal.showLoading();
		},
	});

	try {
		let proceed = true;
		let emailChanged = false;

		if (initialData.email !== formData.get("email").trim()) {
			Swal.close();
			const confirmResult = await Swal.fire({
				title: "Are you sure?",
				text: "This action will permanently change your email!",
				icon: "warning",
				iconColor: "#ff7262",
				showCancelButton: true,
				confirmButtonText: "Yes, change it!",
				cancelButtonText: "Cancel",
				customClass: {
					confirmButton: "custom-confirm-btn",
					cancelButton: "custom-cancel-btn",
				},
				buttonsStyling: false,
			});

			proceed = confirmResult.isConfirmed;

			if (proceed) {
				emailChanged = true;
				Swal.fire({
					title: "Sending OTP...",
					text: "Sending OTP to verify, it's you...",
					icon: "info",
					allowOutsideClick: false,
					showConfirmButton: false,
					willOpen: () => {
						Swal.showLoading();
					},
				});
			}
		}

		if (!proceed) {
			Swal.close();
			return;
		}

		const res = await fetch(url, {
			method,
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

		let successTitle = emailChanged ? "Check Your Email" : "Profile Updated!";

		Swal.close();
		await Swal.fire({
			icon: "success",
			title: successTitle,
			text: result.message || "Your information has been saved successfully.",
			showConfirmButton: false,
			timer: 2500,
		});

		if (emailChanged) {
			window.location.href = "/verifyotp?resetemailotp=true";
			return;
		}
		window.location.reload();
	} catch (err) {
		Swal.close();
		console.error("Error submitting personal info:", err);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while saving your information.",
			confirmButtonColor: "#d33",
		});
	}
});
