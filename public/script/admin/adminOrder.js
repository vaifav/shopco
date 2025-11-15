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
