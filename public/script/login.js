import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const togglePassword = document.querySelectorAll(".toggle-password");
const sendUserEmail = document.querySelector("form.send-useremail");
const passwordContainers = document.querySelectorAll("form .password-container");

passwordContainers.forEach((div) => {
	const imageBtn = div.querySelector(".toggle-password");
	const passwordInput = div.querySelector(".passwordField");

	if (imageBtn && passwordInput) {
		imageBtn.addEventListener("click", () => {
			const currentInputType = passwordInput.getAttribute("type");
			const currentImageSrc = imageBtn.getAttribute("src");

			const newType = currentInputType === "password" ? "text" : "password";
			const newImageSrc = currentImageSrc.includes("closedEye")
				? "/images/icons/openedEye.png"
				: "/images/icons/closedEye.png";

			passwordInput.setAttribute("type", newType);
			imageBtn.src = newImageSrc;
		});
	}
});

if (sendUserEmail) {
	sendUserEmail.addEventListener("submit", async (e) => {
		e.preventDefault();
		Swal.fire({
			title: "Sending...",
			text: "Please wait while we send the reset code.",
			icon: "info",
			allowOutsideClick: false,
			showConfirmButton: false,
			willOpen: () => {
				Swal.showLoading();
			},
		});

		const email = sendUserEmail.querySelector("#email").value;
		try {
			const res = await fetch("/useremail", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
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
			const swalResult = await Swal.fire({
				icon: "success",
				title: "Check Your email",
				text: result.message || "Reset code send successfully successfully.",
				showConfirmButton: true,
				timer: 3000,
			});
			if (swalResult.isConfirmed || swalResult.isDismissed) {
				sendUserEmail.reset();
				window.location.href = "/";
			}
		} catch (err) {
			console.error("Error :", err);
			Swal.close();
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while sending the reset code.",
				confirmButtonColor: "#d33",
			});
		}
	});
}

lucide.createIcons();
