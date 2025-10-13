import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const edit = document.querySelector("#personal-information .form-input-container:first-child button");
const submit = document.querySelector("#personal-information .form-input-container input[type='submit']");
const form = document.querySelector("#personal-information form");
const addressOption = document.querySelectorAll("#personal-information form #address option");

let isEditing = false;

edit.addEventListener("click", () => {
	isEditing = true;
	submit.disabled = false;
});

form.addEventListener("change", () => {
	isEditing = true;
	submit.disabled = false;
});

const initialData = {
	email: document.getElementById("email").value.trim(),
};

form.addEventListener("submit", async (e) => {
	e.preventDefault();

	const data = {
		fname: document.getElementById("fname").value.trim(),
		lname: document.getElementById("lname").value.trim(),
		email: document.getElementById("email").value.trim(),
		phone: document.getElementById("phone").value.trim(),
		gender: form.querySelector('input[name="gender"]:checked')?.value,
		address: document.getElementById("address").value.trim(),
	};

	const method = isEditing ? "PATCH" : "POST";
	const url = isEditing ? "/account/personalinfo/edit" : "/account/personalinfo/add";

	try {
		let proceed = true;
		if (initialData.email !== data.email) {
			const confirmResult = await Swal.fire({
				title: "Are you sure?",
				text: "This action will permanently change your email!",
				icon: "warning",
				iconColor: "#ff7262", // 👈 custom icon color
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
		}
		if (!proceed) return;
		const res = await fetch(url, {
			method,
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		const result = await res.json();

		if (!res.ok || !result.success) {
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: result.message || "Something went wrong. Please try again.",
				customClass: {
					confirmButton: "custom-confirm-btn",
				},
				buttonsStyling: false,
			});
			return;
		}

		await Swal.fire({
			icon: "success",
			title: isEditing ? "Profile Updated!" : "Profile Created!",
			text: result.message || "Your information has been saved successfully.",
			showConfirmButton: false,
			timer: 1500,
		});

		window.location.reload();
	} catch (err) {
		console.error("Error submitting personal info:", err);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while saving your information.",
			confirmButtonColor: "#d33",
		});
	}
});
