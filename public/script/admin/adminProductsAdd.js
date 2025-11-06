import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const formSubmit = document.querySelector("#products form");
const variantsContainer = document.querySelector("#products #variantsContainer");
const addVariantBtn = document.querySelector("#products #addVariantBtn");

const cropperModal = document.getElementById("imageCropperModal");
const cropperImageElement = document.getElementById("cropperImage");
const cropSaveBtn = document.getElementById("cropSaveBtn");
const cropCancelBtn = document.getElementById("cropCancelBtn");

let currentCropper = null;
let currentFileInput = null;
let currentPreviewWrapper = null;

let variantIndex =
    variantsContainer.children.length > 0 ? variantsContainer.children.length - 1 : -1;
if (variantIndex === -1) variantIndex = 0;

const fileStore = new Map();


const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png'; 
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};


const updateFilesAndPreview = async (input, newFiles = []) => {
    const inputId = input.id;
    const previewLabel = input.closest('.preview-container').querySelector('.preview.upload-trigger');
    const maxFiles = 4;
    
    const existingFiles = fileStore.get(inputId) || [];
    
    let mergedFiles = [...existingFiles, ...Array.from(newFiles)];
    
    if (mergedFiles.length > maxFiles) {
        await Swal.fire({
            icon: "warning",
            title: "File Limit Reached",
            text: `Maximum of ${maxFiles} images retained. Additional files ignored.`,
            customClass: { confirmButton: "custom-confirm-btn" },
            buttonsStyling: false,
        });
        mergedFiles = mergedFiles.slice(0, maxFiles);
    }

    fileStore.set(inputId, mergedFiles);

    const dataTransfer = new DataTransfer();
    mergedFiles.forEach(file => dataTransfer.items.add(file));
    input.files = dataTransfer.files;

    previewLabel.innerHTML = "";
    if (mergedFiles.length > 0) {
        previewLabel.classList.add("imageActive");
    } else {
        previewLabel.classList.remove("imageActive");
        previewLabel.innerHTML = '<i data-lucide="circle-plus" class="upload-icon"></i>';
        if (typeof lucide !== "undefined" && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    for (const file of mergedFiles) {
        const div = document.createElement("div");
        div.classList.add("preview-image-wrapper");
        
        const fileIdentifier = `${file.name}-${file.lastModified}`;
        div.dataset.fileName = fileIdentifier; 

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = `<img src="${event.target.result}" alt="preview image" data-original-src="${event.target.result}"/>`;
            const deleteButton = `<button type="button" class="delete-image-btn" data-file-id="${fileIdentifier}"><i data-lucide="x"></i></button>`;
            
            div.innerHTML = img + deleteButton;
            previewLabel.append(div);
            if (typeof lucide !== "undefined" && lucide.createIcons) {
                lucide.createIcons();
            }
        };
        reader.readAsDataURL(file);
    }
};

const reindexVariants = () => {
    const variantCards = variantsContainer.querySelectorAll(".variant-card");
    variantIndex = -1; 

    variantCards.forEach((card, newIndex) => {
        variantIndex = newIndex;
        card.dataset.variantIndex = newIndex;

        const display = card.querySelector(".variant-index-display");
        if (display) {
            display.textContent = newIndex + 1;
        }

        const removeBtn = card.querySelector(".remove-variant-btn");
        if (removeBtn) {
            removeBtn.dataset.variantIndex = newIndex;
        }
        
        const elementsToUpdate = card.querySelectorAll("input, select, label");
        elementsToUpdate.forEach(el => {
            if (el.hasAttribute('for') && el.getAttribute('for').startsWith('variants[')) {
                const oldFor = el.getAttribute('for');
                const newFor = oldFor.replace(/variants\[\d+\]/g, `variants[${newIndex}]`);
                el.setAttribute('for', newFor);
            }

            if (el.hasAttribute('name') && el.getAttribute('name').startsWith('variants[')) {
                const oldName = el.getAttribute('name');
                const newName = oldName.replace(/variants\[\d+\]/g, `variants[${newIndex}]`);
                el.setAttribute('name', newName);
                el.setAttribute('id', newName); 
            }
        });

        const oldInputId = `variants[${newIndex + 1}][image]`;
        const newInputId = `variants[${newIndex}][image]`; 
        
        if (fileStore.has(oldInputId) && oldInputId !== newInputId) {
            const files = fileStore.get(oldInputId);
            fileStore.set(newInputId, files);
            fileStore.delete(oldInputId);
            
            const input = card.querySelector('.variant-image-input');
            if (input) {
                input.id = newInputId;
                const dataTransfer = new DataTransfer();
                files.forEach(file => dataTransfer.items.add(file));
                input.files = dataTransfer.files;
            }
        }
    });
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
            <input type="number" name="variants[${variantIndex}][stock]" id="variants[${variantIndex}][stock]" placeholder="Enter number of units in stock" value="" min="0" required>
          </div>
        </div>
        `;
    div.innerHTML = varintHtml.trim();
    variantsContainer.append(div);
    if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons();
    }
});


variantsContainer.addEventListener("click", async (e) => {
    const deleteBtn = e.target.closest(".delete-image-btn");
    const removeVariantBtn = e.target.closest(".remove-variant-btn"); 
    const trigger = e.target.closest(".manual-upload-trigger");
    const clickedImageWrapper = e.target.closest(".preview-image-wrapper");
    
    if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();

        const fileIdToRemove = deleteBtn.dataset.fileId;
        const input = deleteBtn.closest('.preview-container').querySelector('.variant-image-input');
        const inputId = input.id;
        
        let currentFiles = fileStore.get(inputId) || [];
        const updatedFiles = currentFiles.filter(file => {
            return `${file.name}-${file.lastModified}` !== fileIdToRemove;
        });
        
        fileStore.set(inputId, updatedFiles);

        const dataTransfer = new DataTransfer();
        updatedFiles.forEach(file => dataTransfer.items.add(file));
        input.files = dataTransfer.files;

        deleteBtn.closest('.preview-image-wrapper').remove();
        
        if (updatedFiles.length === 0) {
            const previewLabel = input.closest('.preview-container').querySelector('.preview.upload-trigger');
            previewLabel.classList.remove("imageActive");
            previewLabel.innerHTML = '<i data-lucide="circle-plus" class="upload-icon"></i>';
            if (typeof lucide !== "undefined" && lucide.createIcons) {
                lucide.createIcons();
            }
        }
        return; 
    }

    if (removeVariantBtn) {
        e.preventDefault();
        e.stopPropagation();

        const variantCard = removeVariantBtn.closest(".variant-card");

        if (variantsContainer.children.length === 1) {
            await Swal.fire({
                icon: "warning",
                title: "Cannot Remove Last Variant",
                text: "You must have at least one product variant.",
                customClass: { confirmButton: "custom-confirm-btn" },
                buttonsStyling: false,
            });
            return;
        }
        
        const variantDOMIndex = parseInt(variantCard.dataset.variantIndex);
        const inputId = `variants[${variantDOMIndex}][image]`;
        fileStore.delete(inputId);
        
        variantCard.remove();
        
        reindexVariants();
        
        return;
    }

    if (trigger) {
        e.preventDefault(); 
        const fileInput = trigger.closest(".preview-container").querySelector(".variant-image-input");
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
        currentFileInput = clickedImageWrapper.closest(".preview-container").querySelector(".variant-image-input");

        cropperImageElement.src = imgSrc;
        cropperModal.style.display = "flex";

        if (currentCropper) { currentCropper.destroy(); }
        setTimeout(() => {
            currentCropper = new Cropper(cropperImageElement, { aspectRatio: 1 / 1, viewMode: 1 });
        }, 100);
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


cropSaveBtn.addEventListener("click", () => {
    if (!currentCropper || !currentFileInput || !currentPreviewWrapper) return;
    
    const canvas = currentCropper.getCroppedCanvas();
    const croppedDataURL = canvas.toDataURL("image/png");

    const previewWrapper = currentPreviewWrapper;
    const previewImg = previewWrapper.querySelector("img");

    if (previewImg) { previewImg.src = croppedDataURL; }

    const originalFileId = previewWrapper.dataset.fileName;
    const deleteBtn = previewWrapper.querySelector('.delete-image-btn');
    
    const baseName = originalFileId.split('-').slice(0, -1).join('-'); 
    const newFileName = baseName + '-' + Date.now(); 
    const croppedFile = dataURLtoFile(croppedDataURL, newFileName);
    
    const inputId = currentFileInput.id;
    let files = fileStore.get(inputId) || [];
    let fileFoundAndReplaced = false;

    const updatedFiles = files.map(file => {
        const fileIdentifier = `${file.name}-${file.lastModified}`;
        if (fileIdentifier === originalFileId && !fileFoundAndReplaced) {
            fileFoundAndReplaced = true;
            return croppedFile; 
        }
        return file;
    });

    fileStore.set(inputId, updatedFiles);

    const dataTransfer = new DataTransfer();
    updatedFiles.forEach(file => dataTransfer.items.add(file));
    currentFileInput.files = dataTransfer.files;
    
    const newFileId = `${croppedFile.name}-${croppedFile.lastModified}`;
    previewWrapper.dataset.fileName = newFileId;
    if (deleteBtn) { deleteBtn.dataset.fileId = newFileId; }

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
    const formData = new FormData(formSubmit);
    
    const productName = document.getElementById("productName").value.trim();
    if (!productName) {
        await Swal.fire({ icon: "warning", title: "Missing Field", text: "Please enter a Product Name.", buttonsStyling: false });
        return;
    }

    Swal.fire({
        title: "Processing...",
        text: "Please wait while we upload the product.",
        icon: "info",
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => { Swal.showLoading(); },
    });

    try {
        const res = await fetch("/admin/products/action", {
            method: "POST",
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
            title: "Product Created!",
            text: result.message || "Your information has been saved successfully.",
            showConfirmButton: false,
            timer: 1500,
        });
        formSubmit.reset();
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