import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";
const wishlistContainer = document.querySelector(".wishlist-container");
const clearWishlistBtn = document.getElementById("clear-wishlist-btn");

if (wishlistContainer) {
	wishlistContainer.addEventListener("click", async (e) => {
		const removeButton = e.target.closest(".remove-item");
		const addToCart = e.target.closest(".add-to-cart-btn");
		if (removeButton) {
			e.preventDefault();

			const variantId = removeButton.getAttribute("data-variantid");
			const itemArticle = removeButton.closest(".wishlist-item");
			const itemName = itemArticle.querySelector(".item-name a")?.textContent.trim() || "Item";

			const { isConfirmed } = await Swal.fire({
				title: `Remove ${itemName}?`,
				text: "Are you sure you want to remove this item from your wishlist?",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#dd3333ff",
				cancelButtonColor: "#020303ff",
				confirmButtonText: "Yes, remove it!",
			});

			if (!isConfirmed) {
				return;
			}

			try {
				const url = `/wishlist/${variantId}`;
				const res = await fetch(url, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (res.status === 401 || res.redirected) {
					await Swal.fire({
						icon: "info",
						title: "Login Required",
						text: "Please log in to update your wishlist.",
						confirmButtonText: "Go to Login",
					}).then((result) => {
						if (result.isConfirmed) {
							window.location.href = "/login";
						}
					});
					return;
				}

				const result = await res.json();

				if (!res.ok || !result.success) {
					throw new Error(result.message || "Failed to remove item on the server.");
				}

				itemArticle.remove();

				if (wishlistContainer.children.length === 0) {
					wishlistContainer.innerHTML =
						'<p class="empty-wishlist-message">Your wishlist is empty! Start adding some favorites.</p>';
				}

				await Swal.fire({
					icon: "success",
					title: "Removed!",
					text: `${itemName} was removed from your wishlist.`,
					showConfirmButton: false,
					timer: 1500,
				});
				return;
			} catch (error) {
				console.error("Wishlist removal error:", error);
				await Swal.fire({
					icon: "error",
					title: "Error!",
					text: error.message || "An unexpected error occurred during removal.",
					confirmButtonColor: "#d33",
				});
			}
		}
		if (addToCart) {
			const itemArticle = addToCart.closest(".wishlist-item");
			const variantId = addToCart.dataset.variantid;
			const color = addToCart.dataset.color;
			const size = addToCart.dataset.size;
			const count = addToCart.dataset.count;

			const productData = {
				variantId: variantId,
				color: color,
				size: size,
				count: count,
			};

			try {
				const res = await fetch("/cart", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						productData,
					}),
				});

				const result = await res.json();

				if (!res.ok || !result.success) {
					await Swal.fire({
						icon: "error",
						title: "Failed!",
						text: result.message || "An unknown error occurred.",
						confirmButtonColor: "#d33",
					});
					return;
				}
				itemArticle.remove();
				await Swal.fire({
					icon: "success",
					title: "Item Added to cart",
					text: result.message,
					showConfirmButton: false,
					timer: 1500,
				});
				return;
			} catch (error) {
				console.error("Fetch error:", error);
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: "Could not connect to the server or process the request.",
					confirmButtonColor: "#d33",
				});
				return;
			}
		}
	});
}

if (clearWishlistBtn) {
	clearWishlistBtn.addEventListener("click", async () => {
		const itemsCount = wishlistContainer.querySelectorAll(".wishlist-item").length;
		if (itemsCount === 0) {
			await Swal.fire({
				icon: "info",
				title: "Already Empty",
				text: "Your wishlist is already clear!",
				showConfirmButton: false,
				timer: 1500,
			});
			return;
		}

		const { isConfirmed } = await Swal.fire({
			title: "Clear Entire Wishlist?",
			text: `You are about to remove all ${itemsCount} items. This action cannot be undone.`,
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, clear it!",
		});

		if (!isConfirmed) {
			return;
		}

		try {
			const url = "/wishlist";
			const res = await fetch(url, {
				method: "DELETE",
			});

			if (res.status === 401 || res.redirected) {
				await Swal.fire({
					icon: "info",
					title: "Login Required",
					text: "Please log in to clear your wishlist.",
					confirmButtonText: "Go to Login",
				}).then((result) => {
					if (result.isConfirmed) {
						window.location.href = "/login";
					}
				});
				return;
			}

			const result = await res.json();

			if (!res.ok || !result.success) {
				throw new Error(result.message || "Server failed to clear the wishlist.");
			}

			wishlistContainer.innerHTML =
				'<p class="empty-wishlist-message">Your wishlist is empty! Start adding some favorites.</p>';

			await Swal.fire({
				icon: "success",
				title: "Wishlist Cleared!",
				text: result.message,
				showConfirmButton: false,
				timer: 1500,
			});
		} catch (error) {
			console.error("Clear wishlist error:", error);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: error.message || "Could not connect to the server or process the request.",
				confirmButtonColor: "#d33",
			});
		}
	});
}

addToCart.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const variantId = btn.dataset.variantid;
		const color = btn.dataset.color;
		const size = btn.dataset.size;
		const count = btn.dataset.count;

		const productData = {
			variantId: variantId,
			color: color,
			size: size,
			count: count,
		};

		try {
			const res = await fetch("/cart", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					productData,
				}),
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: result.message || "An unknown error occurred.",
					confirmButtonColor: "#d33",
				});
				return;
			}

			await Swal.fire({
				icon: "success",
				title: "Item Added to cart",
				text: result.message,
				showConfirmButton: false,
				timer: 1500,
			});
			return;
		} catch (error) {
			console.error("Fetch error:", error);
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: "Could not connect to the server or process the request.",
				confirmButtonColor: "#d33",
			});
			return;
		}
	});
});
