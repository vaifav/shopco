import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";
lucide.createIcons();

const handleStatusUpdate = async (event) => {
	const selectElement = event.target;
	const newItemStatus = selectElement.value;
	const itemId = selectElement.dataset.itemid;
	const orderId = selectElement.dataset.orderid;

	const originalStatus = selectElement.dataset.originalStatus || selectElement.value;

	const url = `/admin/orders/${orderId}/items/${itemId}/status`;
	selectElement.disabled = true;

	try {
		const response = await fetch(url, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				newStatus: newItemStatus,
			}),
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.message || "Failed to update item status on server.");
		}

		selectElement.dataset.originalStatus = result.newItemStatus;

		const itemStatusSpan = selectElement
			.closest("tr")
			.querySelector(".item-status-cell .item-status");

		itemStatusSpan.className = "item-status";
		const newItemStatusClass = `status-${result.newItemStatus.toLowerCase()}`;
		itemStatusSpan.classList.add(newItemStatusClass);
		itemStatusSpan.querySelector("b").textContent = result.newItemStatus;

		const overallStatusSpan = document.querySelector(".status-action-bar .order-status");
		const overallStatusSelect = document.querySelector(".order-status-select");

		const currentOverallClass = overallStatusSpan.className
			.split(" ")
			.find((cls) => cls.startsWith("status-"));
		if (currentOverallClass) {
			overallStatusSpan.classList.remove(currentOverallClass);
		}

		const newOverallStatusClass = `status-${result.newOverallStatus
			.toLowerCase()
			.replace(/ /g, "-")}`;
		overallStatusSpan.classList.add(newOverallStatusClass);
		overallStatusSpan.querySelector("b").textContent = result.newOverallStatus;

		overallStatusSelect.querySelector("option").value = result.newOverallStatus;
		overallStatusSelect.querySelector("option").textContent = result.newOverallStatus;

		Swal.fire({
			icon: "success",
			title: "Status Updated!",
			text: `Item status updated to ${result.newItemStatus}. Overall order is now ${result.newOverallStatus}.`,
			timer: 3000,
			showConfirmButton: false,
		});
	} catch (error) {
		console.error("Update failed:", error);

		selectElement.value = originalStatus;

		Swal.fire({
			icon: "error",
			title: "Update Failed ",
			html: `Reason: ${error.message}<br>Status reverted to ${originalStatus}.`,
			showConfirmButton: true,
		});
	} finally {
		selectElement.disabled = false;
	}
};

document.addEventListener("DOMContentLoaded", () => {
	const itemStatusSelects = document.querySelectorAll(".item-status-select");
	itemStatusSelects.forEach((select) => {
		select.addEventListener("change", handleStatusUpdate);

		select.dataset.originalStatus = select.value;
	});
});
