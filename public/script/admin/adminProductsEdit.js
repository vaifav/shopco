import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const formSubmit = document.querySelector("#products form");
const variantsContainer = document.querySelector("#variantsContainer");
const addVariantBtn = document.querySelector("#addVariantBtn");

const cropperModal = document.getElementById("imageCropperModal");
const cropperImageElement = document.getElementById("cropperImage");
const cropSaveBtn = document.getElementById("cropSaveBtn");
const cropCancelBtn =  document.getElementById("cropCancelBtn");

let currentCropper = null;
let currentFileInput = null;
let currentPreviewWrapper = null;

let variantCards = variantsContainer.querySelectorAll(".variant-card");
let variantIndex = variantCards.length > 0 ? variantCards.length - 1 : -1;
if (variantIndex === -1) variantIndex = 0;

const fileStore = new Map();

const imagesToDelete = [];

const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const getFileIdentifier = (item) => {
    return item instanceof File ? `${item.name}-${item.lastModified}` : item;
};

const renderPreview = (input, mergedItems) => {
    const previewLabel = input.closest(".preview-container").querySelector(".preview.upload-trigger");

    previewLabel.innerHTML = "";

    if (mergedItems.length > 0) {
        previewLabel.classList.add("imageActive");
    } else {
        previewLabel.classList.remove("imageActive");
        previewLabel.innerHTML = '<i data-lucide="circle-plus" class="upload-icon"></i>';
        if (typeof lucide !== "undefined" && lucide.createIcons) {
            lucide.createIcons();
        }
        return;
    }

    mergedItems.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("preview-image-wrapper");

        const isFile = item instanceof File;
        const fileIdentifier = getFileIdentifier(item);
        const src = isFile ? URL.createObjectURL(item) : item;

        div.dataset.fileName = fileIdentifier;
        div.dataset.isNewImage = isFile ? "true" : "false";

        const img = `<img src="${src}" alt="preview image"/>`;
        const deleteButton = `<button type="button" class="delete-image-btn" data-file-id="${fileIdentifier}"><i data-lucide="x"></i></button>`;

        div.innerHTML = img + deleteButton;

        if (isFile) {
            const cropButton = `<button type="button" class="crop-image-btn" data-file-id="${fileIdentifier}"><i data-lucide="crop"></i></button>`;
            div.innerHTML = img + cropButton + deleteButton;
        }

        previewLabel.append(div);
    });

    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
};

const updateFilesAndPreview = async (input, newFiles = []) => {
    const inputId = input.id;
    const maxFiles = 4;

    const existingItems = fileStore.get(inputId) || [];

    let mergedItems = [...existingItems, ...Array.from(newFiles)];

    if (mergedItems.length > maxFiles) {
        await Swal.fire({
            icon: "warning",
            title: "File Limit Reached",
            text: `Maximum of ${maxFiles} images retained. Additional files ignored.`,
            customClass: { confirmButton: "custom-confirm-btn" },
            buttonsStyling: false,
        });
        mergedItems = mergedItems.slice(0, maxFiles);
    }

    fileStore.set(inputId, mergedItems);

    const dataTransfer = new DataTransfer();
    mergedItems.filter((item) => item instanceof File).forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    renderPreview(input, mergedItems);
};

const displayError = (input, message) => {
    const container = input.closest(".input-container");
    container.querySelectorAll(".error-message").forEach((el) => el.remove());
    container.classList.remove("error");

    if (message) {
        container.classList.add("error");
        const errorMessage = document.createElement("span");
        errorMessage.classList.add("error-message");
        errorMessage.textContent = message;
        container.append(errorMessage);
    }
};

const validateGeneralFields = () => {
    let isValid = true;
    const generalFields = formSubmit.querySelectorAll(".left input[required], .left select[required]");

    formSubmit.querySelectorAll(".left .input-container").forEach((container) => {
        container.classList.remove("error");
        container.querySelectorAll(".error-message").forEach((el) => el.remove());
    });

    generalFields.forEach((input) => {
        if (input.tagName === "SELECT" && input.value === "") {
            displayError(input, `The field is required.`);
            isValid = false;
        } else if (input.type !== "file") {
            input.value = input.value.trim();
            if (!input.checkValidity() || input.value === "") {
                const fieldName = input.id.charAt(0).toUpperCase() + input.id.slice(1);
                displayError(input, `${fieldName} is required.`);
                isValid = false;
            }
        }
    });

    return isValid;
};

const validateVariants = () => {
    let isValid = true;
    const currentVariantCards = variantsContainer.querySelectorAll(".variant-card");

    if (currentVariantCards.length === 0) {
        isValid = false;
        Swal.fire({
            icon: "warning",
            title: "Missing Variants",
            text: "You must have at least one product variant.",
            customClass: { confirmButton: "custom-confirm-btn" },
            buttonsStyling: false,
        });
        return isValid;
    }

    currentVariantCards.forEach((card) => {
        const requiredInputs = card.querySelectorAll("input[required]");

        card.querySelectorAll(".input-container").forEach((container) => {
            container.classList.remove("error");
            container.querySelectorAll(".error-message").forEach((el) => el.remove());
        });

        requiredInputs.forEach((input) => {
            if (input.type === "text" || input.type === "number") {
                input.value = input.value.trim();
            }

            if (!input.checkValidity() || input.value === "") {
                const inputName = input.name.split("][")[1].replace("]", "");
                const fieldName = inputName.charAt(0).toUpperCase() + inputName.slice(1);
                displayError(input, `${fieldName} is required.`);
                isValid = false;
            }
        });

        const imageInput = card.querySelector(".variant-image-input");
        if (imageInput) {
            const imageCount = fileStore.get(imageInput.id)?.length || 0;
            if (imageCount === 0) {
                displayError(imageInput, "At least one image is required.");
                isValid = false;
            }
        }
    });

    return isValid;
};

addVariantBtn.addEventListener("click", async (e) => {
    variantIndex++;

    if (variantIndex >= 10) {
        await Swal.fire({
            icon: "warning",
            title: "Variants Exceed!",
            text: "You can't add variants more than 10...",
            customClass: { confirmButton: "custom-confirm-btn" },
            buttonsStyling: false,
        });
        variantIndex--;
        return;
    }

    const div = document.createElement("div");
    div.classList.add("variant-card");
    div.dataset.variantIndex = variantIndex;

    const varintHtml = `
        <h1>Variant <span class="variant-index-display">${variantIndex + 1}</span></h1>
        <button type="button" class="remove-variant-btn" data-variant-index="${variantIndex}">
            <i data-lucide="trash-2"></i>
        </button>
        <div class="variant-input-container">
          <input type="hidden" name="variants[${variantIndex}][isNew]" value="true">

          <div class="input-container preview-container">
            <label for="variants[${variantIndex}][image]">Images <span>( Only 4 Images are allowed )</span></label>
            <input type="file" name="variants[${variantIndex}][image]" id="variants[${variantIndex}][image]" multiple accept="image/*" class="variant-image-input" style="display: none;">
            
            <label class="preview upload-trigger">
              <i data-lucide="circle-plus" class="upload-icon"></i>
            </label>
            <label class="manual-upload-trigger"> 
              <i data-lucide="plus"></i>
            </label>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][price]">Price</label>
            <input type="number" name="variants[${variantIndex}][price]" id="variants[${variantIndex}][price]" placeholder="e.g., 50.00" value="" min="0" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][discountedPrice]">Discounted Price <span class="optional">(Optional)</span></label>
            <input type="number" name="variants[${variantIndex}][discountedPrice]" id="variants[${variantIndex}][discountedPrice]" placeholder="e.g., 40.00" value="" min="0">
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][color]">Color</label>
            <input type="text" name="variants[${variantIndex}][color]" id="variants[${variantIndex}][color]" placeholder="e.g., Red or #FF0000" value="" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][sizes]">Sizes</label>
            <input type="text" name="variants[${variantIndex}][sizes]" id="variants[${variantIndex}][sizes]" placeholder="e.g., S, M, L, XL (comma separated)" value="" required>
          </div>

          <div class="input-container">
            <label for="variants[${variantIndex}][stock]">Stock Quantity</label>
            <input type="number" name="variants[${variantIndex}][stock]" id="variants[${variantIndex}][stock]" placeholder="Enter number of units in stock" value="0" min="0" required>
          </div>
        </div>
        `;

    div.innerHTML = varintHtml.trim();

    addVariantBtn.before(div);

    fileStore.set(`variants[${variantIndex}][image]`, []);

    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
});

variantsContainer.addEventListener("click", async (e) => {
    const removeBtn = e.target.closest(".remove-variant-btn");

    if (removeBtn) {
        const variantCard = removeBtn.closest(".variant-card");
        const variantId = variantCard.dataset.variantId;
        const inputId = variantCard.querySelector(".variant-image-input").id;

        if (variantsContainer.querySelectorAll(".variant-card").length <= 1) {
            await Swal.fire({
                icon: "error",
                title: "Cannot Remove Last Variant",
                text: "Your product must have at least one variant.",
                customClass: { confirmButton: "custom-confirm-btn" },
                buttonsStyling: false,
            });
            return;
        }

        const currentFiles = fileStore.get(inputId) || [];
        currentFiles
            .filter((item) => typeof item === "string")
            .forEach((url) => imagesToDelete.push(url));
        fileStore.delete(inputId);

        if (variantId) {
            const deleteInput = document.createElement("input");
            deleteInput.type = "hidden";
            deleteInput.name = "variantsToDelete[]";
            deleteInput.value = variantId;
            formSubmit.append(deleteInput);
        }

        variantCard.remove();

        variantsContainer.querySelectorAll(".variant-card").forEach((card, index) => {
            const oldIndex = card.dataset.variantIndex;
            const newIndex = index;

            card.dataset.variantIndex = newIndex;
            card.querySelector(".variant-index-display").textContent = newIndex + 1;

            if (fileStore.has(`variants[${oldIndex}][image]`)) {
                const files = fileStore.get(`variants[${oldIndex}][image]`);
                fileStore.delete(`variants[${oldIndex}][image]`);
                fileStore.set(`variants[${newIndex}][image]`, files);
            }

            card.querySelectorAll('[name^="variants["]').forEach((input) => {
                const oldName = input.name;
                const newName = oldName.replace(`variants[${oldIndex}]`, `variants[${newIndex}]`);
                input.name = newName;

                if (input.id) {
                    input.id = input.id.replace(`variants[${oldIndex}]`, `variants[${newIndex}]`);
                }
            });

            card.querySelectorAll('label[for^="variants["]').forEach((label) => {
                label.htmlFor = label.htmlFor.replace(`variants[${oldIndex}]`, `variants[${newIndex}]`);
            });
        });

        variantIndex = variantsContainer.querySelectorAll(".variant-card").length - 1;
    }
});

variantsContainer.addEventListener("change", async (e) => {
    if (e.target.classList.contains("variant-image-input")) {
        const input = e.target;
        const newSelection = Array.from(input.files);
        input.value = null;
        await updateFilesAndPreview(input, newSelection);
    }
});

variantsContainer.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".delete-image-btn");
    const manualTrigger = e.target.closest(".manual-upload-trigger");
    const clickedImageWrapper = e.target.closest(".preview-image-wrapper");

    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();

        const fileIdToRemove = deleteBtn.dataset.fileId;
        const input = deleteBtn.closest(".preview-container").querySelector(".variant-image-input");
        const inputId = input.id;
        let currentItems = fileStore.get(inputId) || [];
        const updatedItems = currentItems.filter((item) => {
            const itemIdentifier = getFileIdentifier(item);
            if (itemIdentifier === fileIdToRemove) {
                if (typeof item === "string") {
                    imagesToDelete.push(item);
                }
                return false;
            }
            return true;
        });

        fileStore.set(inputId, updatedItems);
        const dataTransfer = new DataTransfer();
        updatedItems
            .filter((item) => item instanceof File)
            .forEach((file) => dataTransfer.items.add(file));
        input.files = dataTransfer.files;
        renderPreview(input, updatedItems);
        return;
    }

    if (manualTrigger) {
        e.preventDefault();
        const fileInput = manualTrigger
            .closest(".preview-container")
            .querySelector(".variant-image-input");
        const existingCount = fileStore.get(fileInput.id)?.length || 0;

        if (existingCount >= 4) {
            Swal.fire({
                icon: "warning",
                title: "File Limit Reached",
                text: "You have already uploaded the maximum of 4 images.",
                customClass: { confirmButton: "custom-confirm-btn" },
                buttonsStyling: false,
            });
            return;
        }
        fileInput.click();
        return;
    }

    if (clickedImageWrapper && clickedImageWrapper.closest("label.preview.upload-trigger")) {
        e.preventDefault();
        e.stopPropagation();

        const imgElement = clickedImageWrapper.querySelector("img");
        currentPreviewWrapper = clickedImageWrapper;
        const imgSrc = imgElement.src;
        currentFileInput = clickedImageWrapper
            .closest(".preview-container")
            .querySelector(".variant-image-input");

        cropperImageElement.src = imgSrc;
        cropperModal.style.display = "flex";

        if (currentCropper) {
            currentCropper.destroy();
        }
        setTimeout(() => {
            currentCropper = new Cropper(cropperImageElement, { aspectRatio: 1 / 1, viewMode: 1 });
        }, 100);
    }
});

cropSaveBtn.addEventListener("click", () => {
    if (!currentCropper || !currentFileInput || !currentPreviewWrapper) return;

    const canvas = currentCropper.getCroppedCanvas();
    const croppedDataURL = canvas.toDataURL("image/png");

    const originalFileId = currentPreviewWrapper.dataset.fileName;
    const isExistingImage = currentPreviewWrapper.dataset.isNewImage === "false";
    const inputId = currentFileInput.id;

    const baseName = isExistingImage
        ? `cropped-existing-${originalFileId.split("/").pop().split("?")[0]}`
        : originalFileId.split("-").slice(0, -1).join("-");

    const newFileName = baseName + "-" + Date.now() + ".png";
    const croppedFile = dataURLtoFile(croppedDataURL, newFileName);

    let items = fileStore.get(inputId) || [];
    let itemFoundAndReplaced = false;

    const updatedItems = items.map((item) => {
        const itemIdentifier = getFileIdentifier(item);
        if (itemIdentifier === originalFileId && !itemFoundAndReplaced) {
            itemFoundAndReplaced = true;

            if (isExistingImage) {
                imagesToDelete.push(originalFileId);
            }
            return croppedFile;
        }
        return item;
    });

    fileStore.set(inputId, updatedItems);

    const dataTransfer = new DataTransfer();
    updatedItems
        .filter((item) => item instanceof File)
        .forEach((file) => dataTransfer.items.add(file));
    currentFileInput.files = dataTransfer.files;

    renderPreview(currentFileInput, updatedItems);

    currentCropper.destroy();
    currentCropper = null;
    currentFileInput = null;
    currentPreviewWrapper = null;
    cropperModal.style.display = "none";
});

cropCancelBtn.addEventListener("click", () => {
    if (currentCropper) {
        currentCropper.destroy();
        currentCropper = null;
        currentFileInput = null;
        currentPreviewWrapper = null;
    }
    cropperModal.style.display = "none";
});

formSubmit.addEventListener("submit", async (e) => {
    e.preventDefault();

    const generalValid = validateGeneralFields();
    const variantsValid = validateVariants();

    if (!generalValid || !variantsValid) {
        const firstError = document.querySelector(".input-container.error");
        if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        if (variantsContainer.querySelectorAll(".variant-card").length > 0) {
            await Swal.fire({
                icon: "error",
                title: "Validation Error!",
                text: "Please fill in all required fields marked in red.",
                customClass: { confirmButton: "custom-confirm-btn" },
                buttonsStyling: false,
            });
        }
        return;
    }

    const productId = formSubmit.getAttribute("data-id");

    const formData = new FormData(); 
    formSubmit.querySelectorAll('input:not([type="file"]), select, textarea').forEach(input => {
        if (input.name && input.value) {
            if (input.type === 'hidden' && input.name.startsWith('variantsToDelete')) {
                 formData.append(input.name, input.value);
            }
            if (input.type !== 'hidden' || !input.name.startsWith('variantsToDelete')) {
                formData.append(input.name, input.value);
            }
        }
    });

    variantsContainer.querySelectorAll(".variant-image-input").forEach(input => {
        const inputId = input.id;
        const items = fileStore.get(inputId) || [];
        const variantIndexMatch = inputId.match(/variants\[(\d+)\]/);
        
        if (!variantIndexMatch) return;
        const variantIndex = variantIndexMatch[1];

        items.forEach(item => {
            if (item instanceof File) {
                formData.append(`variants[${variantIndex}][image]`, item, item.name);
            } else if (typeof item === 'string') {
                formData.append(`variants[${variantIndex}][existingImages][]`, item);
            }
        });
    });

    imagesToDelete.forEach((url) => {
        formData.append("imagesToDelete[]", url);
    });

    Swal.fire({
        title: "Processing...",
        text: "Updating product details and images.",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading();
        },
    });

    try {
        const res = await fetch(`/admin/products/action/${productId}`, {
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
            title: "Product Updated!",
            text: result.message || "Your information has been saved successfully.",
            showConfirmButton: false,
            timer: 1500,
        });
        window.location.pathname = "/admin/products/";
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

document.querySelectorAll(".variant-card").forEach((card) => {
    const fileInput = card.querySelector(".variant-image-input");
    const previewLabel = card.querySelector(".preview.upload-trigger");

    if (!fileInput || !previewLabel) return;
    const existingImages = Array.from(card.querySelectorAll(".preview-image-wrapper img"))
        .map((img) => img.src)
        .filter((src) => src && src.includes("http"));
    fileStore.set(fileInput.id, existingImages);
    
    previewLabel.innerHTML = "";
    renderPreview(fileInput, fileStore.get(fileInput.id) || []);

    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
});
if (typeof lucide !== "undefined" && lucide.createIcons) {
    lucide.createIcons();
}