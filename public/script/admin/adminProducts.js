import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const addProductBtn = document.querySelector("#products header button");
const searchForm = document.querySelector("#products .products-search form");
const filterButtonContainer = document.querySelector(
	"#products .products-search .active-block-filter"
);
const filterListItems = document.querySelectorAll(
	"#products .products-search .active-block-filter ul li:not(:first-child)"
);
const activeFilter = document.querySelector(
	"#products .products-search .active-block-filter .active"
);
const blockedFilter = document.querySelector(
	"#products .products-search .active-block-filter .blocked"
);
const edit = document.querySelectorAll("#products .action-btn.edit-btn");
const softDelete = document.querySelectorAll("#products .action-btn.delete-btn");
const unblock = document.querySelectorAll("#products .action-btn.unblock-btn");

if (filterButtonContainer) {
	filterButtonContainer.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		const clickedListItem = e.target.closest("li:not(:first-child)");

		if (!clickedListItem) {
			filterButtonContainer.classList.toggle("open");
		}
	});
}

document.addEventListener("click", (e) => {
	if (filterButtonContainer && filterButtonContainer.classList.contains("open")) {
		if (!filterButtonContainer.contains(e.target)) {
			filterButtonContainer.classList.remove("open");
		}
	}
});

addProductBtn.addEventListener("click", (e) => {
	window.location.pathname = "/admin/products/action";
});

function addOrUpdateQueryParams(params) {
	const url = new URL(window.location.href);
	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			url.searchParams.set(key, params[key]);
		}
	}
	window.history.pushState({}, "", url.toString());
	window.location.reload();
}

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

activeFilter.addEventListener("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	addOrUpdateQueryParams({ isBlocked: false });
});

blockedFilter.addEventListener("click", (e) => {
	e.preventDefault();
	e.stopPropagation();
	addOrUpdateQueryParams({ isBlocked: true });
});

const sortToggle = (field, element, initVal) => {
	const fieldArr = ["createdAt", "productName", "rating", "stock", "price"];
	let index = fieldArr.indexOf(field);

	if (index > -1) fieldArr.splice(index, 1);

	const btn = document.querySelector(element);

	btn.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
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

sortToggle("createdAt", "#products .products-search .up-down", -1);
sortToggle("productName", "#products .products-search .sort-name", 1);
sortToggle("variants", "#products .products-search .sort-variants", -1);
sortToggle("rating", "#products .products-search .rating", 1);
sortToggle("stock", "#products .products-search .stock", 1);
sortToggle("price", "#products .products-search .price", 1);

searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let search = searchForm.querySelector("input#adn-search").value;
	addOrUpdateQueryParams({ search: search });
});

edit.forEach((btn) => {
	btn.addEventListener("click", () => {
		const id = btn.getAttribute("data-id").trim();
		window.location.href = `/admin/products/action/${id}`;
	});
});

softDelete.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const id = btn.getAttribute("data-id").trim();
		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "This action will temporarly remove the product!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "Cancel",
		});

		if (!confirmResult.isConfirmed) return;

		try {
			const res = await fetch(`/admin/products/action/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
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
				title: "Product Removed",
				text: result.message || "Your product has been Removed successfully.",
				showConfirmButton: false,
				timer: 1500,
			});

			window.location.pathname = "/admin/products/";
		} catch (error) {
			console.error("Error submitting form:", error);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while deleting your address.",
				confirmButtonColor: "#d33",
			});
		}
	});
});

unblock.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const id = btn.getAttribute("data-id").trim();
		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "This action will Unblock the product!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, unblock it!",
			cancelButtonText: "Cancel",
		});

		if (!confirmResult.isConfirmed) return;

		try {
			const res = await fetch(`/admin/products/action/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isBlocked: false }),
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
				title: "Product Unblocked",
				text: "Your product has been unblocked successfully.",
				showConfirmButton: false,
				timer: 1500,
			});

			window.location.href = "/admin/products/";
		} catch (error) {
			console.error("Error submitting form:", error);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while deleting your address.",
				confirmButtonColor: "#d33",
			});
		}
	});
});
