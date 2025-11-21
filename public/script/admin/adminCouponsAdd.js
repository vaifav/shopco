import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

if (typeof lucide !== "undefined") {
	lucide.createIcons();
}

const form = document.getElementById("createCouponForm");
const scopeSelect = document.getElementById("restrictionScope");
const productGroup = document.querySelector(".product-list-group");
const categoryGroup = document.querySelector(".category-list-group");
const urlParams = new URLSearchParams(window.location.search);
const errorMessage = urlParams.get("error");
const successMessage = urlParams.get("success");

if (errorMessage) {
	let decodedMessage = "An unknown error occurred.";
	try {
		decodedMessage = decodeURIComponent(errorMessage);
	} catch (e) {
		console.error("URI decoding failed. Displaying raw error message.", e);
		decodedMessage = errorMessage;
	}

	Swal.fire({
		icon: "error",
		title: "Coupon Creation Failed",
		text: decodedMessage,
		confirmButtonText: "OK",
		confirmButtonColor: "#d33",
	});
}

if (successMessage) {
	let decodedMessage = "Operation successful.";
	try {
		decodedMessage = decodeURIComponent(successMessage);
	} catch (e) {
		decodedMessage = successMessage;
	}

	Swal.fire({
		icon: "success",
		title: "Coupon Created",
		text: decodedMessage,
		showConfirmButton: false,
		timer: 1500,
	}).then(() => {
		window.location.href = "/admin/coupons";
	});
}

function toggleRestrictionFields() {
	const scope = scopeSelect.value;
	productGroup.style.setProperty("display", "none", "important");
	categoryGroup.style.setProperty("display", "none", "important");

	if (scope.includes("Products")) {
		productGroup.style.setProperty("display", "block", "important");
	} else if (scope.includes("Categories")) {
		categoryGroup.style.setProperty("display", "block", "important");
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

	if (selectedNames.length === 0) {
		selectedTextSpan.textContent = "Select items...";
	} else if (selectedNames.length === 1) {
		selectedTextSpan.textContent = selectedNames[0];
	} else {
		selectedTextSpan.textContent = `${selectedNames.length} selected`;
	}
}

scopeSelect.addEventListener("change", toggleRestrictionFields);
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

const discountTypeInput = document.getElementById("discountType");
const discountValueInput = document.getElementById("discountValue");
const maxDiscountAmountInput = document.getElementById("maxDiscountAmount");
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


function validateForm() {
	const discountType = discountTypeInput.value;
	const discountValue = parseFloat(discountValueInput.value);
	const maxDiscountAmount = parseFloat(maxDiscountAmountInput.value);
	const startDate = new Date(startDateInput.value);
	const expiryDate = new Date(expiryDateInput.value);

	if (!document.getElementById("code").value.trim()) {
		showValidationError("Coupon Code is required.");
		return false;
	}
	if (discountValueInput.value === "" || isNaN(discountValue) || discountValue <= 0) {
		showValidationError("Discount Value must be a positive number.");
		return false;
	}

	if (discountType === "percentage" && discountValue > 100) {
		showValidationError("Percentage discount cannot exceed 100%.");
		return false;
	}

	if (maxDiscountAmountInput.value !== "" && (isNaN(maxDiscountAmount) || maxDiscountAmount < 0)) {
		showValidationError("Max Discount Cap must be a positive number or left blank.");
		return false;
	}

	if (startDateInput.value === "" || expiryDateInput.value === "") {
		showValidationError("Start Date and Expiry Date are required.");
		return false;
	}

	if (expiryDate <= startDate) {
		showValidationError("Expiry Date must be later than the Start Date.");
		return false;
	}

	const scope = scopeSelect.value;
	const productList = document.getElementById("productRestrictionList").value;
	const categoryList = document.getElementById("categoryRestrictionList").value;

	if (scope.includes("Products") && productList === "") {
		showValidationError("You selected a Product restriction scope, but no products were selected.");
		return false;
	}
	if (scope.includes("Categories") && categoryList === "") {
		showValidationError(
			"You selected a Category restriction scope, but no categories were selected."
		);
		return false;
	}

	return true;
}

form.addEventListener("submit", (e) => {
	if (!validateForm()) {
		e.preventDefault();
	}
});
