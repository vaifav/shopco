import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";
lucide.createIcons();
const custTr = document.querySelectorAll(`#customers table tbody tr`);
const block = document.querySelectorAll("#customers table tbody tr td.actions svg");

custTr.forEach((tr) => {
	tr.addEventListener("click", (e) => {
		const tds = tr.querySelectorAll("td");
		const lastTd = tds[tds.length - 1];
		if (lastTd.contains(e.target)) return;
		window.location.href = `/admin/customers/${tr.dataset.id}`;
	});
});

block.forEach((btn) => {
	const toBoolean = (str) => str === "true";

	let isBlocked = toBoolean(btn.dataset.isblocked);
	const id = btn.dataset.toggleBlockId;
	btn.addEventListener("click", async () => {
		try {
			const confirmResult = await Swal.fire({
				title: "Are you sure?",
				text: isBlocked
					? "This action will unblock the customer!"
					: "This action will block the customer!",
				icon: "warning",
				showCancelButton: true,
				confirmButtonColor: "#d33",
				cancelButtonColor: "#3085d6",
				confirmButtonText: "Yes, block",
				cancelButtonText: "Cancel",
			});
			if (!confirmResult.isConfirmed) return;
			isBlocked = !isBlocked;

			console.log(isBlocked);
			const res = await fetch(`/admin/customers/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					isBlocked,
				}),
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: result.message || "Something went wrong. Please try again.",
					confirmButtonColor: "#d33",
				});
				return;
			}

			await Swal.fire({
				icon: "success",
				title: result.message,
				text: result.message + " successfully.",
				showConfirmButton: false,
				timer: 1500,
			});
			window.location.pathname = `/admin/customers`;
		} catch (error) {
			console.error("Error", error.stack);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: `${error}`,
				confirmButtonColor: "#d33",
			});
		}
	});
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

const createdAtFilterToggle = () => {
	let val = -1;
	const arrow = document.querySelector("#customers .customer-search .up-down");

	arrow.addEventListener("click", () => {
		const url = new URL(window.location.href);
		let val = parseInt(url.searchParams.get("createdAt")) || -1;

		val = val === -1 ? 1 : -1;
		url.searchParams.set("createdAt", val);

		window.location.href = url.toString();
	});
};

createdAtFilterToggle();
const searchForm = document.querySelector("#customers .customer-search form");
const activeCustomerFilter = document.querySelector(
	"#customers .customer-search .search-container .active-block-filter ul li.active"
);
const blockedCustomerFilter = document.querySelector(
	"#customers .customer-search .search-container .active-block-filter ul li.blocked"
);
const totalCustomerFilter = document.querySelector(
	"#customers .customer-search .search-container .active-block-filter ul li.total"
);

activeCustomerFilter.addEventListener("click", () => {
	addOrUpdateQueryParams({ isBlocked: false });
});

blockedCustomerFilter.addEventListener("click", () => {
	addOrUpdateQueryParams({ isBlocked: true });
});

totalCustomerFilter.addEventListener("click", () => {
	const url = new URL(window.location.href);
	const isBlocked = url.searchParams.get("isBlocked");
	if (isBlocked) {
		url.searchParams.delete("isBlocked");
		window.location.href = url.toString();
	}
});

searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let search = searchForm.querySelector("input#adn-search").value;
	addOrUpdateQueryParams({ search: search });
});
