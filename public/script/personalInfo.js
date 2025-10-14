import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const edit = document.querySelector("#personal-information .form-input-container:first-child button");
const submit = document.querySelector("#personal-information .form-input-container input[type='submit']");
const form = document.querySelector("#personal-information form");
const profileInput = document.getElementById("#personal-information profile");
const profileImg = document.querySelector("#personal-information .figure label img");

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

  const formData = new FormData(form);
  const method = isEditing ? "PATCH" : "POST";
  const url = isEditing ? "/account/personalinfo/edit" : "/account/personalinfo/add";

  try {
    let proceed = true;
    if (initialData.email !== formData.get("email").trim()) {
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
    }
    if (!proceed) return;

    const res = await fetch(url, {
      method,
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

profileInput.addEventListener("change", async(e) => {
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
    profileImg.src = event.target.result;
  };
  reader.readAsDataURL(file);
});