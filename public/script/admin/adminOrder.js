const allStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"];
async function updateOrderStatus(newStatus, orderId, selectElement) {
	if (typeof Swal === "undefined") {
		console.error("SweetAlert2 is not loaded. Cannot display notification.");
		return;
	}

	selectElement.disabled = true;
	const statusDisplay = document.getElementById(`status-display-${orderId}`);
	const currentStatusBeforeUpdate = selectElement.getAttribute("data-current-status");

	try {
		const response = await fetch(`/admin/orders/${orderId}/status`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				newStatus,
			}),
		});

		const data = await response.json();

		if (response.ok && data.success) {
			statusDisplay.classList.remove(...allStatuses.map((s) => s.toLowerCase()));
			statusDisplay.classList.add(data.newStatus.toLowerCase());
			statusDisplay.querySelector("span:last-child").textContent = data.newStatus;
			selectElement.setAttribute("data-current-status", data.newStatus);
			console.log("Status Updated Successfully:", data.message);

			Swal.fire({
				icon: "success",
				title: "Status Updated!",
				text: `Order ${orderId.slice(0, 8)}... is now ${data.newStatus}.`,
				timer: 1500,
				showConfirmButton: false,
			});
		} else {
			console.error("Update Failed:", data.message || "Server error occurred.");
			selectElement.value = currentStatusBeforeUpdate;

			Swal.fire({
				icon: "error",
				title: "Update Failed",
				text: data.message || "Server error occurred. Status remains unchanged.",
			});
		}
	} catch (error) {
		console.error("Network Error:", error);
		selectElement.value = currentStatusBeforeUpdate;

		Swal.fire({
			icon: "error",
			title: "Connection Error",
			text: "An unexpected error occurred. Please check your network connection.",
		});
	} finally {
		selectElement.disabled = false;
	}
}

function initializeOrderPage() {
	if (typeof lucide !== "undefined" && lucide.createIcons) {
		lucide.createIcons();
	}

	document.querySelectorAll(".status-select-in-table").forEach((select) => {
		const currentStatus = select.value;
		select.setAttribute("data-current-status", currentStatus);
	});
}

window.addEventListener("load", initializeOrderPage);
window.updateOrderStatus = updateOrderStatus;

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

const searchForm = document.querySelector(".admin-search");
const searchClear = document.querySelector(".adn-clear-label");

searchClear.addEventListener("click", () => {
	addOrUpdateQueryParams({ search: "" });
});
searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const search = searchForm.querySelector("input").value;
	addOrUpdateQueryParams({ search });
});

const sortToggle = (field, element, initVal) => {
	const fieldArr = ["createdAt"];
	let index = fieldArr.indexOf(field);

	if (index > -1) fieldArr.splice(index, 1);

	const listItem = document.querySelector(element);

	listItem.addEventListener("click", (e) => {
		e.preventDefault();
		e.stopPropagation();
		const filterButton = document.querySelector(".active-block-filter");
		const filterList = filterButton.querySelector("ul");

		filterList.classList.remove("activate-ul");

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
sortToggle("createdAt", ".up-down", -1);

const dateInput = document.querySelector("#orderDate");

const fp = flatpickr(dateInput, {
	dateFormat: "Y-m-d",
	altFormat: "M j, Y",
	altInput: true,
	allowInput: true,
	weekNumbers: true,
	onClose: function (selectedDates, dateStr) {
		if (dateStr) {
			addOrUpdateQueryParams({ date: encodeURIComponent(dateStr) });
		}
	},
});

const dateFilter = document.querySelector(".date-filter div");

dateFilter.addEventListener("click", () => {
	addOrUpdateQueryParams({ date: "" });
});

function setDateValueToDateInput() {
	const url = new URL(window.location.href);
	const dateParam = url.searchParams.get("date");

	if (dateParam) {
		const decodedDate = decodeURIComponent(dateParam);
		fp.setDate(decodedDate);
	}
}
setDateValueToDateInput();

const filterButton = document.querySelector(".active-block-filter");
const filterList = filterButton.querySelector("ul");

filterButton.addEventListener("click", function (event) {
	event.stopPropagation();
	filterList.classList.toggle("active-ul");
});

filterList.addEventListener("click", function (event) {
	event.stopPropagation();
	const li = event.target.closest("li");
	if (li) {
		if (li.getAttribute("data-status") !== null) {
			const status = li.getAttribute("data-status");
			addOrUpdateQueryParams({ status });
		}
	}
});
document.addEventListener("click", function (event) {
	if (!filterButton.contains(event.target)) {
		filterList.classList.remove("active-ul");
	}
});
