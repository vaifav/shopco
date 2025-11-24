import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const mobileSearchForm = document.querySelector(".mobile-search-form");
const mobileFilterBtn = document.querySelector(".mobile-filter-btn");
const closeFilterBtn = document.querySelector(".close-filter-btn");
const asideModalWrapper = document.querySelector(".aside-modal-wrapper");
const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
const filterHeads = document.querySelectorAll(".filter .head");
const search = document.querySelector(".header nav form");
const filterDropDownCategory = document.querySelectorAll("ul.filter-drop-down li");
const filterDropDownSize = document.querySelectorAll("ul.size-drop-down li");
const clearFilterBtn = document.querySelector(".clear-filter-btn");
const priceForm = document.querySelector("aside form");
const minPriceInput = document.getElementById("price-range-start");
const maxPriceInput = document.getElementById("price-range-end");
const categoryHeading = document.querySelector(".category-heading");

const closeFilterDrawer = () => {
	if (asideModalWrapper) {
		asideModalWrapper.classList.remove("active");
		document.body.style.overflow = "";
	}
};

if (mobileFilterBtn && asideModalWrapper) {
	mobileFilterBtn.addEventListener("click", () => {
		asideModalWrapper.classList.add("active");
		document.body.style.overflow = "hidden";
	});
}

if (closeFilterBtn) {
	closeFilterBtn.addEventListener("click", closeFilterDrawer);
}

if (asideModalWrapper) {
	asideModalWrapper.addEventListener("click", (e) => {
		if (e.target === asideModalWrapper) {
			closeFilterDrawer();
		}
	});
}

filterHeads.forEach((head) => {
	head.addEventListener("click", () => {
		const filterSection = head.closest(".filter");
		if (filterSection) {
			filterSection.classList.toggle("active");
		}
	});
});

function addOrUpdateQueryParams(params) {
	const url = new URL(window.location.href);
	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			if (params[key] === "" || params[key] === null) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, params[key]);
			}
		}
	}
	window.history.pushState({}, "", url.toString());
	window.location.reload();
}

const sortToggle = (event, field, element, initVal) => {
	const fieldArr = ["price"];
	let index = fieldArr.indexOf(field);

	if (index > -1) fieldArr.splice(index, 1);

	const btn = document.querySelector(element);

	btn.addEventListener(event, () => {
		const url = new URL(window.location.href);
		let val = parseInt(url.searchParams.get(field)) || initVal;

		val = val === -1 ? 1 : -1;
		fieldArr.forEach((params) => {
			if (url.searchParams.has(params)) {
				url.searchParams.delete(params);
			}
		});

		url.searchParams.set(field, val);
		window.location.href = url.toString();
	});
};

sortToggle("change", "price", ".sort-section #sortby", -1);

document.querySelectorAll(".pagination .pagination-btn").forEach((btn) => {
	btn.addEventListener("click", (e) => {
		e.preventDefault();
		const page = btn.getAttribute("data-page");
		const limit = btn.getAttribute("data-limit");
		addOrUpdateQueryParams({
			page,
			limit,
		});
	});
});

search.addEventListener("submit", (e) => {
	e.preventDefault();
	const value = search.querySelector("input").value.toString();
	addOrUpdateQueryParams({ search: value });
});

if (mobileSearchForm) {
	mobileSearchForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const value = mobileSearchForm.querySelector("input").value.toString();
		addOrUpdateQueryParams({ search: value });
	});
}

function getSelectedCategoriesFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const categoryParam = urlParams.get("category");
	return categoryParam
		? categoryParam
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s !== "")
		: [];
}

filterDropDownCategory.forEach((li) => {
	const categoryId = li.getAttribute("data-categoryid").trim();
	li.addEventListener("click", () => {
		let selectedCategories = getSelectedCategoriesFromURL();

		if (categoryId === "") {
			addOrUpdateQueryParams({ category: "" });
			closeFilterDrawer();
			return;
		}

		if (selectedCategories.includes(categoryId)) {
			selectedCategories = selectedCategories.filter((id) => id !== categoryId);
		} else {
			selectedCategories.push(categoryId);
		}

		const newCategoryQuery = selectedCategories.join(",");
		addOrUpdateQueryParams({ category: newCategoryQuery });
	});
});

function getSelectedSizesFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const sizeParam = urlParams.get("size");
	return sizeParam
		? sizeParam
				.split(",")
				.map((s) => s.trim())
				.filter((s) => s !== "")
		: [];
}

filterDropDownSize.forEach((li) => {
	const size = li.getAttribute("data-size").trim();
	li.addEventListener("click", () => {
		let selectedSizes = getSelectedSizesFromURL();

		if (size === "") {
			addOrUpdateQueryParams({ size: "" });
			closeFilterDrawer();
			return;
		}

		if (selectedSizes.includes(size)) {
			selectedSizes = selectedSizes.filter((s) => s !== size);
		} else {
			selectedSizes.push(size);
		}

		const newSizeQuery = selectedSizes.join(",");
		addOrUpdateQueryParams({ size: newSizeQuery });
	});
});

function activeCategoryName() {
	const selectedCategories = getSelectedCategoriesFromURL();

	filterDropDownCategory.forEach((item) => {
		item.classList.remove("selected");
	});

	selectedCategories.forEach((id) => {
		const activeItem = document.querySelector(`.filter-drop-down li[data-categoryid="${id}"]`);
		if (activeItem) {
			activeItem.classList.add("selected");
		}
	});

	const allLink = document.querySelector('.filter-drop-down li[data-categoryid=""]');
	if (allLink) {
		if (selectedCategories.length === 0) {
			allLink.classList.add("selected");
			categoryHeading.innerHTML = allLink.textContent.trim().replace("chevron-right", "");
		} else {
			allLink.classList.remove("selected");

			if (selectedCategories.length > 1) {
				categoryHeading.innerHTML = "Multiple Categories";
			} else {
				const firstActiveItem = document.querySelector(
					`.filter-drop-down li[data-categoryid="${selectedCategories[0]}"]`
				);
				categoryHeading.innerHTML = firstActiveItem
					? firstActiveItem.textContent.trim().replace("chevron-right", "")
					: "All";
			}
		}
	}
}
activeCategoryName();

function activeSizeBtn() {
	const selectedSizes = getSelectedSizesFromURL();

	filterDropDownSize.forEach((item) => {
		item.classList.remove("selected");
	});

	selectedSizes.forEach((size) => {
		const activeItem = document.querySelector(`.size-drop-down li[data-size="${size}"]`);
		if (activeItem) {
			activeItem.classList.add("selected");
		}
	});

	const allLink = document.querySelector('.size-drop-down li[data-size=""]');
	if (allLink) {
		if (selectedSizes.length === 0) {
			allLink.classList.add("selected");
		} else {
			allLink.classList.remove("selected");
		}
	}
}
activeSizeBtn();

// --- Other Filters ---
priceForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const minPriceValue = minPriceInput.value.trim();
	const maxPriceValue = maxPriceInput.value.trim();

	addOrUpdateQueryParams({ minprice: minPriceValue, maxprice: maxPriceValue });
	closeFilterDrawer();
});

clearFilterBtn.addEventListener("click", () => {
	window.location.href = "/products";
});

navToProductDetailPage.forEach((article) => {
	const id = article.getAttribute("data-productid").trim();
	const variantid = article.getAttribute("data-variantid").trim();

	article.addEventListener("click", async (e) => {
		const addToCart = e.target.closest("span.cart-icon");
		const fav = e.target.closest("span.favorite-icon");

		if (addToCart) {
			e.preventDefault();
			e.stopPropagation();

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

				await Swal.fire({
					icon: "success",
					title: "Item Added to cart",
					text: result.message,
					showConfirmButton: false,
					timer: 1500,
				});
				const fav = article.querySelector("span.favorite-icon");
				if (fav.classList.contains("fav")) {
					fav.classList.remove("fav");
				}
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

		if (fav) {
			e.preventDefault();
			e.stopPropagation();

			const variantid = fav.getAttribute("data-variantid").trim();
			const isCurrentlyFavorite = fav.classList.contains("fav");

			const method = isCurrentlyFavorite ? "DELETE" : "POST";
			const url = isCurrentlyFavorite ? `/wishlist/${variantid}` : "/wishlist";
			const actionText = method === "POST" ? "Item moved to wishlist" : "Item removed from wishlist";

			const requestOptions = {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: method === "POST" ? JSON.stringify({ variantId: variantid }) : null,
			};

			fav.classList.toggle("fav");
			try {
				const res = await fetch(url, requestOptions);
				console.log(res);

				if (res.status === 401 || res.redirected) {
					await Swal.fire({
						icon: "info",
						title: "Login Required",
						text: "Please log in or create an account to save items to your wishlist.",
						confirmButtonText: "Go to Login",
						showCancelButton: true,
						cancelButtonText: "Cancel",
					}).then((result) => {
						if (result.isConfirmed) {
							window.location.href = "/login";
						}
					});
					fav.classList.toggle("fav");
					return;
				}

				const result = await res.json();
				if (!res.ok || !result.success) {
					await Swal.fire({
						icon: "error",
						title: "Failed!",
						text: result.message || "An unknown error occurred.",
						confirmButtonColor: "#d33",
					});
					fav.classList.toggle("fav");
					return;
				}

				await Swal.fire({
					icon: "success",
					title: actionText,
					text: result.message,
					showConfirmButton: false,
					timer: 1500,
				});
				return;
			} catch (error) {
				console.error(error);
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: "Could not connect to the server or process the request.",
					confirmButtonColor: "#d33",
				});
				fav.classList.toggle("fav");
				return;
			}
		}

		window.location.href = `/products/${id}/${variantid}`;
	});
});

lucide.createIcons();
