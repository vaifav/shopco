import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const imageInput = document.querySelector("#category form #category-image");
const preview = document.querySelector("#category form .add-image-label");
const form = document.querySelector("#category.add-or-edit-category-section form");

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
		profileInput.value = "";
		return;
	}

	const reader = new FileReader();
	reader.onload = (event) => {
		preview.innerHTML = "";
		const img = document.createElement("img");
		img.src = event.target.result;
		preview.append(img);
	};
	reader.readAsDataURL(file);
});

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const formData = new FormData(form);
	try {
		const res = await fetch("/admin/categories/action/", {
			method: "POST",
			body: formData,
		});

		const result = await res.json();

		if (!res.ok || !result.success) {
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: result.message || "Something went wrong. Please try again.",
				customClass: { confirmButton: "custom-confirm-btn" },
				buttonsStyling: false,
			});
			return;
		}

		await Swal.fire({
			icon: "success",
			title: "Category Created!",
			text: result.message || "Your information has been saved successfully.",
			showConfirmButton: false,
			timer: 1500,
		});
		form.reset();
		window.location.pathname = "/admin/categories/";
	} catch (err) {
		console.error("Error :", err);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while saving the information.",
			confirmButtonColor: "#d33",
		});
	}
});
