import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const couponTable = document.querySelector(".coupon-list-table");
const navToAddCouponPageBtn = document.querySelector(".nav-add-coupon");
navToAddCouponPageBtn.addEventListener("click", () => {
	window.location.href = "/admin/coupons/add";
});

if (couponTable) {
	couponTable.addEventListener("click", async (event) => {
		const deleteButton = event.target.closest(".delete-btn");
		const editButton = event.target.closest(".action-btn.edit-btn");
		if (deleteButton) {
			const couponId = deleteButton.dataset.id;

			const result = await Swal.fire({
				title: `Are you sure you want to Delete this coupon?`,
				text:
					"Deleting this coupon will permanently remove it from the list and prevent future use. You cannot undo this action easily.",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#000",
				confirmButtonText: "Yes, Archive it!",
			});

			if (!result.isConfirmed) {
				return;
			}

			try {
				const response = await fetch(`/admin/coupons/${couponId}`, {
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
					},
				});

				const data = await response.json();

				if (data.success) {
					await Swal.fire({
						icon: "success",
						title: "Deleted!",
						text: data.message,
						timer: 1500,
						showConfirmButton: false,
					});

					window.location.reload();
				} else {
					Swal.fire({
						icon: "error",
						title: "Error",
						text: data.message || "Failed to archive coupon.",
					});
				}
			} catch (error) {
				console.error("AJAX Error:", error);
				Swal.fire({
					icon: "error",
					title: "Network Error",
					text: "Could not connect to the server. Please try again.",
				});
			}
			return;
		}

		if (editButton) {
			const couponId = editButton.getAttribute("data-id");
			window.location.href = `/admin/coupons/${couponId}`;
		}
	});
}

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

const search = document.querySelector(".coupons-search");
const searchClear = document.querySelector(".adn-clear-label");
search.addEventListener("submit", (e) => {
	e.preventDefault();
	const value = search.querySelector("input").value.toString();
	addOrUpdateQueryParams({ search: value });
});
searchClear.addEventListener("click", () => {
	addOrUpdateQueryParams({ search: "" });
});

const filterButton = document.querySelector("#coupons .active-block-filter");
const filterDropdown = filterButton ? filterButton.querySelector("ul") : null;
const filterListItems = filterDropdown ? filterDropdown.querySelectorAll("li") : [];

filterButton.addEventListener("click", (event) => {
	event.preventDefault();
	filterDropdown.classList.toggle("activate-ul");
});

filterListItems.forEach((item) => {
	item.addEventListener("click", (event) => {
		event.stopPropagation();
		const isActive = item.getAttribute("data-isactive");
		addOrUpdateQueryParams({ isActive });
	});
});

document.addEventListener("click", (event) => {
	if (!filterButton.contains(event.target) && filterDropdown.classList.contains("activate-ul")) {
		filterDropdown.classList.remove("activate-ul");
	}
});
