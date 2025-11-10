import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const form = document.getElementById("changePasswordForm");
const forgotPassword = document.querySelector(".forgot-password");

forgotPassword.addEventListener("click", async (e) => {
	e.preventDefault();
	Swal.fire({
		title: "Sending Token....",
		text: "Wait until we send you the token",
		icon: "info",
		allowOutsideClick: false,
		showConfirmButton: false,
		willOpen: () => {
			Swal.showLoading();
		},
	});
	const body = document.getElementById("hiddenEmail").value.trim();
	console.log(body);

	const res = await fetch("/changepassword/forgotpassword", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			email: body,
		}),
	});

	const result = await res.json();

	if (!res.ok || !result.success) {
		Swal.close();
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

	Swal.close();
	await Swal.fire({
		icon: "success",
		title: "Check Your Email",
		text: result.message || "Your information has been saved successfully.",
		showConfirmButton: false,
		timer: 2500,
	});
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();

	const formData = new FormData(form);
	const data = Object.fromEntries(formData.entries());

	if (data.newPassword !== data.confirmPassword) {
		Swal.fire({
			icon: "error",
			title: "Password Mismatch",
			text: "New Password and Confirm Password must match.",
		});
		return;
	}

	try {
		const response = await fetch(form.action, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(data),
		});

		if (response.ok) {
			const result = await response.json();

			if (result.success) {
				await Swal.fire({
					icon: "success",
					title: "Success!",
					text: result.message || "Your password has been changed successfully.",
					confirmButtonText: "OK",
				});
				window.location.href = "/account";
			} else {
				Swal.fire({
					icon: "error",
					title: "Change Failed",
					text: result.error || "Could not change password. Please check your current password.",
				});
			}
		} else {
			const errorResult = await response.json();
			Swal.fire({
				icon: "error",
				title: `Error`,
				text: errorResult.message,
			});
		}
	} catch (error) {
		console.error("Fetch Error:", error);
		Swal.fire({
			icon: "error",
			title: "Network Error",
			text: "Could not reach the server. Please check your connection.",
		});
	}
});
