import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

if (typeof lucide !== "undefined") {
    lucide.createIcons();
}

const form = document.getElementById("editCouponForm");
const scopeSelect = document.getElementById("restrictionScope");
const productGroup = document.querySelector(".product-list-group");
const categoryGroup = document.querySelector(".category-list-group");

const codeInput = document.getElementById("code");
const titleInput = document.getElementById("title");
const discountTypeInput = document.getElementById("discountType");
const discountValueInput = document.getElementById("discountValue");
const maxDiscountAmountInput = document.getElementById("maxDiscountAmount");
const maxGlobalUsesInput = document.getElementById("maxGlobalUses");
const maxUsesPerUserInput = document.getElementById("maxUsesPerUser");
const minPurchaseAmountInput = document.getElementById("minPurchaseAmount");
const startDateInput = document.getElementById("startDate");
const expiryDateInput = document.getElementById("expiryDate");

function showValidationError(message) {
    Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: message,
        confirmButtonText: "Fix It",
    });
}

function toggleRestrictionFields() {
    const scope = scopeSelect.value;
    productGroup.style.display = "none";
    categoryGroup.style.display = "none";

    if (scope.includes("Products")) {
        productGroup.style.display = "block";
    } else if (scope.includes("Categories")) {
        categoryGroup.style.display = "block";
    }
}

function updateCustomSelect(listContainer) {
    const targetId = listContainer.dataset.listFor;
    const hiddenInput = document.getElementById(targetId);
    const triggerDiv = listContainer.previousElementSibling;
    const selectedTextSpan = triggerDiv.querySelector(".selected-text");

    const checkboxes = listContainer.querySelectorAll('input[type="checkbox"]');
    const selectedValues = [];
    const selectedNames = [];

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
            selectedValues.push(checkbox.dataset.value);
            selectedNames.push(checkbox.dataset.name);
        }
    });

    hiddenInput.value = selectedValues.join(",");

    const defaultLabel =
        listContainer
            .closest(".restriction-dropdown-group")
            .querySelector("label")
            .textContent.replace(" IDs to Target", "") + "...";

    if (selectedNames.length === 0) {
        selectedTextSpan.textContent = defaultLabel;
    } else if (selectedNames.length === 1) {
        selectedTextSpan.textContent = selectedNames[0];
    } else {
        selectedTextSpan.textContent = `${selectedNames.length} selected`;
    }
}

function validateForm() {
    if (!codeInput.value.trim() || !titleInput.value.trim()) {
        showValidationError("Coupon Code and Title are mandatory fields.");
        return false;
    }

    const discountValue = Number(discountValueInput.value);
    const maxDiscountAmount = Number(maxDiscountAmountInput.value);
    const discountType = discountTypeInput.value;

    if (discountValue <= 0) {
        showValidationError("Discount Value must be greater than zero.");
        return false;
    }

    if (discountType === "percentage" && discountValue > 100) {
        showValidationError("Percentage discount cannot exceed 100%.");
        return false;
    }

    if (
        maxDiscountAmount < 0 ||
        (maxDiscountAmount === 0 && maxDiscountAmountInput.value.trim() !== "")
    ) {
        showValidationError("Max Discount Cap cannot be negative.");
        return false;
    }

    const maxGlobalUses = Number(maxGlobalUsesInput.value);
    const maxUsesPerUser = Number(maxUsesPerUserInput.value);
    const minPurchaseAmount = Number(minPurchaseAmountInput.value);

    if (maxGlobalUses < 1 && maxGlobalUsesInput.value.trim() !== "") {
        showValidationError("Max Global Uses must be at least 1, or left blank for unlimited.");
        return false;
    }

    if (maxUsesPerUser < 1) {
        showValidationError("Max Uses Per User must be at least 1.");
        return false;
    }

    if (minPurchaseAmount < 0) {
        showValidationError("Minimum Purchase Amount cannot be negative.");
        return false;
    }

    const startDate = new Date(startDateInput.value);
    const expiryDate = new Date(expiryDateInput.value);

    if (!startDateInput.value || !expiryDateInput.value) {
        showValidationError("Start Date and Expiry Date are required.");
        return false;
    }

    if (expiryDate <= startDate) {
        showValidationError("Expiry Date must be strictly later than the Start Date.");
        return false;
    }

    const scope = scopeSelect.value;
    const productRestrictionList = document.getElementById("productRestrictionList").value;
    const categoryRestrictionList = document.getElementById("categoryRestrictionList").value;

    if (scope.includes("Products") && productRestrictionList.length === 0) {
        showValidationError(
            `You selected to ${
                scope.includes("include") ? "include" : "exclude"
            } specific products, but no products were selected.`
        );
        return false;
    }

    if (scope.includes("Categories") && categoryRestrictionList.length === 0) {
        showValidationError(
            `You selected to ${
                scope.includes("include") ? "include" : "exclude"
            } specific categories, but no categories were selected.`
        );
        return false;
    }

    return true;
}

toggleRestrictionFields();

const customSelectGroups = document.querySelectorAll(".restriction-dropdown-group");

customSelectGroups.forEach((group) => {
    const trigger = group.querySelector(".custom-select-trigger");
    const list = group.querySelector(".custom-select-list");
    const arrow = group.querySelector(".dropdown-arrow");

    updateCustomSelect(list);

    const toggleDropdown = () => {
        list.classList.toggle("open");
        arrow.style.transform = list.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
    };

    trigger.addEventListener("click", toggleDropdown);
    trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleDropdown();
        }
    });

    list.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            updateCustomSelect(list);
        });
    });

    document.addEventListener("click", (e) => {
        if (!group.contains(e.target)) {
            list.classList.remove("open");
            arrow.style.transform = "rotate(0deg)";
        }
    });
});

scopeSelect.addEventListener("change", toggleRestrictionFields);

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const formData = new FormData(form);
    const couponId = codeInput.closest("form").action.split("/").slice(-1)[0].split("?")[0];

    const data = {};
    formData.forEach((value, key) => {
        if (key === "maxDiscountAmount" && value.trim() === "") {
            data[key] = null;
        } else if (key === "maxGlobalUses" && value.trim() === "") {
            data[key] = Infinity;
        } else if (["discountValue", "maxUsesPerUser", "minPurchaseAmount"].includes(key)) {
            data[key] = Number(value);
        } else if (key === "isActive") {
            data[key] = value === "true";
        } else {
            data[key] = value;
        }
    });

    Swal.fire({
        title: "Updating Coupon...",
        text: "Please wait while changes are saved.",
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });

    try {
        const response = await fetch(`/admin/coupons/${couponId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            throw new Error(responseData.message || "Server Error");
        }

        if (responseData.success) {
            Swal.fire({
                icon: "success",
                title: "Updated!",
                text: responseData.message || "Coupon updated successfully.",
                confirmButtonText: "View Coupons",
            }).then(() => {
                window.location.href = "/admin/coupons";
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: responseData.message || "There was an issue updating the coupon.",
            });
        }
    } catch (error) {
        console.error("AJAX Error:", error);
        Swal.fire({
            icon: "error",
            title: "Request Failed",
            text: error.message || "Could not connect to the server or process request.",
        });
    }
});