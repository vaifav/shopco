import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const activeBlockBtn = document.querySelector("#category .category-search .active-block-filter");
const addCategoryBtn = document.querySelector("#category header button");
const searchForm = document.querySelector("#category .category-search form");
const activeFilter = document.querySelector(
	"#category .category-search .active-block-filter .active"
);
const blockedFilter = document.querySelector(
	"#category .category-search .active-block-filter .blocked"
);
const navToEdit = document.querySelectorAll("#category .category-grid article .edit");
const removeCategory = document.querySelectorAll("#category .category-grid article span.delete");
const restoreCategory = document.querySelectorAll("#category .category-grid article span.unlock");

addCategoryBtn.addEventListener("click", (e) => {
	window.location.pathname = "/admin/categories/action";
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

searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let search = searchForm.querySelector("input#adn-search").value;
	addOrUpdateQueryParams({ search: search });
});

const searchClear = document.querySelector(".adn-clear-label");

searchClear.addEventListener("click", () => {
	addOrUpdateQueryParams({ search: "" });
});

navToEdit.forEach((nav) => {
	nav.addEventListener("click", () => {
		const id = nav.getAttribute("data-id").trim();
		window.location.href = `/admin/categories/action/${id}`;
	});
});

removeCategory.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const id = btn.getAttribute("data-id").trim();
		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "This action will temporarly remove the category!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "Cancel",
		});

		if (!confirmResult.isConfirmed) return;

		try {
			const res = await fetch(`/admin/categories/action/${id}`, {
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
				title: "Category Removed",
				text: result.message || "Your Category has been Removed successfully.",
				showConfirmButton: false,
				timer: 1500,
			});

			window.location.pathname = "/admin/categories/";
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

restoreCategory.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const id = btn.getAttribute("data-id").trim();
		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "Do you want to restore the category ?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, Restore it!",
			cancelButtonText: "Cancel",
		});

		if (!confirmResult.isConfirmed) return;

		try {
			const data = { isBlocked: false };
			const res = await fetch(`/admin/categories/action/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
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
			await Swal.fire({
				icon: "success",
				title: "Category Restored",
				text: result.message || "Your information has been saved successfully.",
				showConfirmButton: false,
				timer: 1500,
			});

			window.location.href = "/admin/categories/";
		} catch (err) {
			console.error("Error :", err);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while saving the information.",
				confirmButtonColor: "#d33",
			});
		}
	});
});

const sortToggle = (field, element, initVal) => {
	const fieldArr = ["createdAt", "sortOrder", "categoryName"];
	let index = fieldArr.indexOf(field);

	if (index > -1) fieldArr.splice(index, 1);

	const listItem = document.querySelector(element);

	listItem.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();

		activeBlockBtn.querySelector("ul").classList.remove("activate-ul");

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

activeBlockBtn.addEventListener("click", (e) => {
	e.stopPropagation();
	const ul = activeBlockBtn.querySelector("ul");
	ul.classList.toggle("activate-ul");
});

activeFilter.addEventListener("click", (e) => {
	e.stopPropagation();
	activeBlockBtn.querySelector("ul").classList.remove("activate-ul");
	addOrUpdateQueryParams({ isBlocked: false });
});

blockedFilter.addEventListener("click", (e) => {
	e.stopPropagation();
	activeBlockBtn.querySelector("ul").classList.remove("activate-ul");
	addOrUpdateQueryParams({ isBlocked: true });
});

sortToggle("createdAt", "#category .category-search .up-down", -1);
sortToggle("sortOrder", ".active-block-filter .sort-by-sort-order", -1);
sortToggle("categoryName", ".active-block-filter .sort-by-category-name", -1);
