import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const quantityControls = document.querySelectorAll(".quantity-control");
const removeItem = document.querySelectorAll(".remove-item");
const subTotalPrice = document.querySelector(
	".order-summary-container .summary-line .summary-value b"
);
const actualTotalPrice = document.querySelector(
	".order-summary-container .summary-line.total-line .summary-value b"
);

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
		if (parentItem.classList.contains("out-of-stock")) {
			minusBtn.disabled = true;
			plusBtn.disabled = true;
			return;
		}

		minusBtn.addEventListener("click", () => {
			let currentQuantity = parseInt(displaySpan.textContent, 10);

			if (currentQuantity > 1) {
				currentQuantity -= 1;
				displaySpan.textContent = currentQuantity;
				const total = calculateTotalPrice();
				subTotalPrice.textContent = total;
				actualTotalPrice.textContent = total;
			}
		});

		plusBtn.addEventListener("click", () => {
			let currentQuantity = parseInt(displaySpan.textContent, 10);

			currentQuantity += 1;
			displaySpan.textContent = currentQuantity;
			const total = calculateTotalPrice();
			subTotalPrice.textContent = total;
			actualTotalPrice.textContent = total;
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

lucide.createIcons();
