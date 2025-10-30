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

		const email = sendUserEmail.querySelector("#email").value;
		try {
			await fetch("/useremail", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			window.location.href = "/forgotpassword";
		} catch (error) {
			console.error("Error initiating password reset:", error);
		}
	});
}

lucide.createIcons();
