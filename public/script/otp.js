import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";
const resendOtp = document.querySelector(".resend-otp");
const emailResetInputValue = document.querySelector("#emailReset");

resendOtp.addEventListener("click", async (e) => {
	e.preventDefault();
	Swal.fire({
		title: "Sending...",
		text: "Please wait while we send the OTP.",
		icon: "info",
		allowOutsideClick: false,
		showConfirmButton: false,
		willOpen: () => {
			Swal.showLoading();
		},
	});
	try {
		let body = {};
		if (emailResetInputValue.value.trim() === "true") {
			body = { emailReset: true };
		} else {
			body = { emailReset: false };
		}

		const res = await fetch("/resentotp", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
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
			if (emailResetInputValue.value.trim() === "true") {
				window.location.href = "/verifyotp?resetemailotp=true";
			} else {
				window.location.href = "/verifyotp";
			}
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

function startOtpTimer(targetDateString, elementId) {
	const targetDate = new Date(targetDateString);
	const now = new Date();
	const timerElement = document.getElementById(elementId);

	if (!timerElement) {
		console.error(`Element with ID '${elementId}' not found.`);
		return;
	}
	if (now < targetDate) {
		console.log("Starting countdown timer...");
		const interval = setInterval(() => {
			const currentTime = new Date();
			let timeDifference = targetDate.getTime() - currentTime.getTime();

			if (timeDifference < 0) {
				clearInterval(interval);
				timerElement.textContent = "OTP has expired.";
				return;
			}

			const totalSeconds = Math.floor(timeDifference / 1000);
			const seconds = totalSeconds % 60;
			const minutes = Math.floor(totalSeconds / 60) % 60;
			const hours = Math.floor(totalSeconds / 3600);
			const formattedTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
				2,
				"0"
			)}:${String(seconds).padStart(2, "0")}`;

			timerElement.textContent = `Time remaining: ${formattedTime}`;
		}, 1000);
	} else {
		timerElement.textContent = "OTP has expired.";
		console.log("The target date has already passed. Timer not started.");
	}
}

async function fetchOtpExpireTime() {
	try {
		const res = await fetch("/otpexpiredate");
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}

		const data = await res.json();
		console.log("Server response data:", data);
		let expirationDateString = "";

		if (emailResetInputValue.value.trim() === "true") {
			expirationDateString = data.emailOtpDate;
		} else {
			expirationDateString = data.otpDate;
		}

		if (expirationDateString) {
			startOtpTimer(expirationDateString, "otp-timer");
		} else {
			console.error("Expiration date not found in server response.");
		}
	} catch (error) {
		console.error("Error fetching OTP expire date:", error);
		await Swal.fire({
			icon: "error",
			title: "Error!",
			text: "Something went wrong while fetching the reset code details.",
			confirmButtonColor: "#d33",
		});
	}
}

fetchOtpExpireTime();
