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

// Function to convert a Data URL (like a cropped image) into a File object
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
    // We try to keep the original file name/type if possible, but default to .png for cropped image
    const name = filename.split('.').slice(0, -1).join('.') || 'cropped_image';
    return new File([u8arr], `${name}.png`, { type: mime });
};

// --- INITIAL IMAGE CHECK (FOR EDIT PAGE) ---
// If the preview contains an existing image from the database, 
// we set currentFile to a dummy object to hold the filename for saving the crop.
const initialImage = previewLabel.querySelector('img');
if (initialImage) {
    // Extract filename from the URL, or use a default
    const url = initialImage.src;
    const filename = url.substring(url.lastIndexOf('/') + 1) || "existing_category_image.jpg";
    // We set currentFile to have a name property so dataURLtoFile can name the new cropped image
    currentFile = { name: filename };
}


/**
 * 1. Event Listener for the hidden file input's 'change' event (Triggered on new file selection).
 */
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

    currentFile = file; // Update currentFile to the newly selected file

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


/**
 * 2. NEW LOGIC: Event Listener for clicking the preview area to re-crop/edit the image.
 */
previewLabel.addEventListener("click", () => {
    const currentImage = previewLabel.querySelector("img");

    if (currentImage) {
        // If an image exists, we are re-cropping it
        cropperImageElement.src = currentImage.src;
        cropperModal.style.display = "flex";

        // IMPORTANT: Ensure currentFile is set for dataURLtoFile if it was only a database image initially
        if (!currentFile && currentImage.src.startsWith('http')) {
            const url = currentImage.src;
            const filename = url.substring(url.lastIndexOf('/') + 1) || "existing_category_image.jpg";
            currentFile = { name: filename };
        }

        // Destroy any existing cropper instance
        if (currentCropper) {
            currentCropper.destroy();
        }

        // Initialize the cropper for re-cropping the displayed image
        setTimeout(() => {
            currentCropper = new Cropper(cropperImageElement, {
                aspectRatio: 1 / 1,
                viewMode: 1,
            });
        }, 100);

    } else {
        // If there's no image (it shows the icon), delegate the click to the file input 
        imageInput.click();
    }
});


/**
 * 3. Event Listener for the 'Save Crop' button.
 */
cropSaveBtn.addEventListener("click", () => {
    // currentFile might be a File object from a new upload, or a simple {name: '...'} object 
    // from an initial database image load.
    if (!currentCropper || !currentFile) return;

    const canvas = currentCropper.getCroppedCanvas({
        width: 400,
        height: 400,
    });
    const croppedDataURL = canvas.toDataURL("image/png");

    // Update the preview
    previewLabel.innerHTML = "";
    const img = document.createElement("img");
    img.src = croppedDataURL;
    previewLabel.append(img);

    // Convert the cropped Data URL back into a File object for submission
    const croppedFile = dataURLtoFile(croppedDataURL, currentFile.name);

    // Update the hidden file input's files property with the cropped image
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    imageInput.files = dataTransfer.files;

    currentCropper.destroy();
    currentCropper = null;
    currentFile = croppedFile; // Keep track of the *final* file
    cropperModal.style.display = "none";
});


/**
 * 4. Event Listener for the 'Cancel Crop' button.
 */
cropCancelBtn.addEventListener("click", () => {
    if (currentCropper) {
        currentCropper.destroy();
        currentCropper = null;
    }
    
    // Clear the input only if the user is canceling an initial upload or they are clearing a previous one
    // If we have existing files in the input or an initial image was loaded, we leave the preview alone.
    if (!imageInput.files.length && !previewLabel.querySelector('img')) {
        imageInput.value = "";
        currentFile = null;
        previewLabel.innerHTML = `<i data-lucide="circle-plus"></i>`;
        
        if (typeof lucide !== "undefined" && lucide.createIcons) {
            lucide.createIcons();
        }
    }
    
    // If the user was re-cropping an existing database image, canceling just closes the modal.
    cropperModal.style.display = "none";
});


/**
 * 5. Event Listener for form submission.
 */
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const categoryNameInput = document.getElementById("categoryName");
    if (!categoryNameInput.value.trim()) {
        await Swal.fire({
            icon: "warning",
            title: "Validation Error",
            text: "Please enter a Category Name before submitting.",
            customClass: { confirmButton: "custom-confirm-btn" },
            buttonsStyling: false,
        });
        categoryNameInput.focus();
        return;
    }
    
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