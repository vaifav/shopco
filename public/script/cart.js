import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const clearCartBtn = document.getElementById("clear-cart-btn");
const cartContainer = document.querySelector(".cart-container");
const cartPageLayout = document.querySelector(".cart-page-layout");
const quantityControls = document.querySelectorAll(".quantity-control");
const removeItem = document.querySelectorAll(".remove-item");
const subTotalPrice = document.querySelector(
	".order-summary-container .summary-line .summary-value b"
);
const actualTotalPrice = document.querySelector(
	".order-summary-container .summary-line.total-line .summary-value b"
);

async function updateCart(variantId, size, newCount) {
	const updateData = {
		variantId: variantId,
		size: size,
		count: newCount,
	};

	try {
		const response = await fetch("/cart", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updateData),
		});

		const result = await response.json();

		if (!response.ok || !result.success) {
			await Swal.fire({
				icon: "error",
				title: "Update Failed",
				text: error.message || "Could not connect to the server to update the item.",
				confirmButtonColor: "#d33",
			});
		}

		return { success: true, newCount: result.newCount };
	} catch (error) {
		console.error("Fetch/Network Error:", error);
		await Swal.fire({
			icon: "error",
			title: "Update Failed",
			text: error.message || "Could not connect to the server to update the item.",
			confirmButtonColor: "#d33",
		});
		return { success: false, message: error.message };
	}
}

function calculateTotalPrice() {
	let totalPrice = 0;

	document.querySelectorAll(".cart-item").forEach((element) => {
		if (!element.classList.contains("out-of-stock")) {
			const priceElement = element.querySelector(".item-price b");
			const qtyElement = element.querySelector(".quantity-display");

			if (priceElement && qtyElement) {
				const price = parseInt(priceElement.textContent, 10);
				const qty = parseInt(qtyElement.textContent, 10);
				totalPrice += price * qty;
			}
		}
	});
	return totalPrice;
}

const total = calculateTotalPrice();
subTotalPrice.textContent = total;
actualTotalPrice.textContent = total;

quantityControls.forEach((control) => {
	const minusBtn = control.querySelector(".minus");
	const plusBtn = control.querySelector(".plus");
	const displaySpan = control.querySelector(".quantity-display");

	const parentItem = control.closest(".cart-item");

	if (minusBtn && plusBtn && displaySpan && parentItem) {
		const itemStock = parseInt(parentItem.dataset.stock, 10);
		const maxQuantity = 10;
		const removeItemBtn = parentItem.querySelector(".remove-item");
		const variantId = removeItemBtn.dataset.variantid;
		const size = removeItemBtn.dataset.size;

		// if (parentItem.classList.contains("out-of-stock")) {
		// 	minusBtn.disabled = true;
		// 	plusBtn.disabled = true;
		// 	return;
		// }

		let initialQuantity = parseInt(displaySpan.textContent, 10);
		if (initialQuantity <= 1) minusBtn.disabled = true;
		if ( initialQuantity >= maxQuantity) plusBtn.disabled = true;

		minusBtn.addEventListener("click", async () => {
			let currentQuantity = parseInt(displaySpan.textContent, 10);

			if (currentQuantity > 1) {
				const newQuantity = currentQuantity - 1;

				const updateResult = await updateCart(variantId, size, newQuantity);

				if (updateResult.success) {
					displaySpan.textContent = newQuantity;
					const total = calculateTotalPrice();
					subTotalPrice.textContent = total;
					actualTotalPrice.textContent = total;

					if (newQuantity <= 1) minusBtn.disabled = true;
					if (newQuantity < maxQuantity) plusBtn.disabled = false;
				}
			}
		});

		plusBtn.addEventListener("click", async () => {
			let currentQuantity = parseInt(displaySpan.textContent, 10);

			if (currentQuantity < maxQuantity && currentQuantity < itemStock) {
				const newQuantity = currentQuantity + 1;

				const updateResult = await updateCart(variantId, size, newQuantity);

				if (updateResult.success) {
					displaySpan.textContent = newQuantity;
					const total = calculateTotalPrice();
					subTotalPrice.textContent = total;
					actualTotalPrice.textContent = total;

					if (newQuantity >= maxQuantity) plusBtn.disabled = true;
					if (newQuantity > 1) minusBtn.disabled = false;
				}
			} else {
				Swal.fire({
					icon: "warning",
					title: "Limit Reached",
					text: `Cannot increase quantity. Maximum is ${maxQuantity} or stock limit is ${itemStock}.`,
					confirmButtonColor: "#3085d6",
				});
			}
		});
	}
});

removeItem.forEach((btn) => {
	btn.addEventListener("click", async (e) => {
		e.preventDefault();
		e.stopPropagation();

		const variantId = btn.dataset.variantid;
		const size = btn.dataset.size;
		const cartItemElement = btn.closest(".cart-item");

		if (!variantId || !size || !cartItemElement) {
			console.error("Missing necessary data or parent element for removal.");
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Item data is incomplete.",
				confirmButtonColor: "#d33",
			});
			return;
		}

		const deleteData = {
			variantId: variantId,
			size: size,
		};

		let result = {};

		try {
			const response = await fetch("/cart", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(deleteData),
			});

			result = await response.json();

			if (!response.ok || !result.success) {
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: result.message || "An error occurred during removal.",
					confirmButtonColor: "#d33",
				});
				return;
			}

			cartItemElement.remove();

			await Swal.fire({
				icon: "success",
				title: "Removed!",
				text: result.message || "Item has been removed from your cart.",
				showConfirmButton: false,
				timer: 1500,
			});
			const total = calculateTotalPrice();
			subTotalPrice.textContent = total;
			actualTotalPrice.textContent = total;

			if (document.querySelectorAll(".cart-item").length === 0) {
				document.querySelector(".cart-page-layout").innerHTML =
					'<p style="text-align: center; width: 100dvw;">No Items in Cart</p>';
			}
		} catch (error) {
			console.error("Fetch/Network Error:", error);

			await Swal.fire({
				icon: "error",
				title: "Network Error",
				text: "Could not connect to the server to remove the item.",
				confirmButtonColor: "#d33",
			});
		}
	});
});

if (clearCartBtn) {
	clearCartBtn.addEventListener("click", async () => {
		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "This will remove ALL items from your cart!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, clear it!",
		});

		if (confirmResult.isConfirmed) {
			try {
				const response = await fetch("/cart/all", {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
				});

				const result = await response.json();

				if (!response.ok || !result.success) {
					throw new Error(result.message || "Failed to clear cart.");
				}

				if (cartPageLayout) {
					cartPageLayout.innerHTML =
						'<p style="text-align: center; width: 100dvw;">No Items in Cart</p>';
				}
				if (clearCartBtn.closest(".cart-header-actions")) {
					clearCartBtn.remove();
				}

				subTotalPrice.textContent = 0;
				actualTotalPrice.textContent = 0;

				await Swal.fire({
					icon: "success",
					title: "Cart Cleared!",
					text: result.message || "Your cart is now empty.",
					showConfirmButton: false,
					timer: 1500,
				});
			} catch (error) {
				console.error("Fetch/Network Error:", error);
				await Swal.fire({
					icon: "error",
					title: "Error!",
					text: error.message || "Could not clear the cart.",
					confirmButtonColor: "#d33",
				});
			}
		}
	});
}

lucide.createIcons();
