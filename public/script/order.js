import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";
lucide.createIcons();

const cancelOrderBtn = document.querySelector(".cancel-btn");
const itemsContainer = document.querySelector(".order-items-table");
const orderStatusElement = document.querySelector(".order-status");


function updateOrderStatusDisplay(newStatus) {
    if (orderStatusElement) {
        orderStatusElement.className = `order-status status-${newStatus.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        orderStatusElement.innerHTML = `<b>${newStatus.toUpperCase()}</b>`;
    }
}

if (cancelOrderBtn) {
	cancelOrderBtn.addEventListener("click", async (e) => {
		const button = e.target.closest("button");
		const orderId = button.dataset.orderId;
		const confirmation = await Swal.fire({
			title: "Cancel Entire Order?",
			text: "This will attempt to cancel ALL unfulfilled items in the order and return stock. This cannot be undone!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, cancel the order!",
		});

		if (confirmation.isConfirmed) {
			try {
				const response = await fetch(`/order/cancel/${orderId}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						status: "Cancelled",
					}),
				});

				const data = await response.json();

				if (response.ok) {
					updateOrderStatusDisplay(data.orderStatus);
					
					const actionBar = document.querySelector(".action-buttons");
					if (actionBar) {
						const invoiceButton = actionBar.querySelector('a[href*="invoice"]').closest('button');
						actionBar.innerHTML = invoiceButton ? invoiceButton.outerHTML : '';
					}
					
					document.querySelectorAll('.order-items-table tbody tr').forEach(row => {
                        const rowStatus = row.querySelector(".item-status").textContent.trim();
                        if (!["DELIVERED", "RETURNED", "CANCELLED"].includes(rowStatus.toUpperCase())) {
                            const statusEl = row.querySelector(".item-status");
                            const actionsEl = row.querySelector(".item-actions-cell");
                            
                            if (statusEl) {
                                statusEl.className = 'item-status status-cancelled';
                                statusEl.innerHTML = '<b>CANCELLED</b>';
                            }
                            if (actionsEl) {
                                actionsEl.innerHTML = '<span class="closed-item-status">Action Complete</span>';
                            }
                        }
					});

					Swal.fire("Cancelled!", `The order status is now ${data.orderStatus}.`, "success");
				} else {
					Swal.fire("Error!", data.message || "Could not cancel the order.", "error");
				}
			} catch (error) {
				Swal.fire("Network Error!", "Failed to connect to the server.", "error");
			}
		}
	});
}

if (itemsContainer) {
    itemsContainer.addEventListener("click", async (e) => {
        const cancelItemBtn = e.target.closest(".cancel-item-btn");
        const returnItemBtn = e.target.closest(".return-item-btn");

        if (cancelItemBtn) {
            const orderId = cancelItemBtn.dataset.orderId;
            const itemId = cancelItemBtn.dataset.itemId;
            const row = cancelItemBtn.closest('tr');
            
            const confirmation = await Swal.fire({
                title: "Cancel This Item?",
                text: "You are about to cancel this single item and return stock.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#d33",
                cancelButtonColor: "#3085d6",
                confirmButtonText: "Yes, cancel this item!",
            });

            if (confirmation.isConfirmed) {
                try {
                    const response = await fetch(`/order/item/cancel/${orderId}/${itemId}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ status: "Cancelled" }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const statusElement = row.querySelector(".item-status");
                        const actionsElement = row.querySelector(".item-actions-cell");
                        
                        if (statusElement) {
                            statusElement.className = "item-status status-cancelled";
                            statusElement.innerHTML = "<b>CANCELLED</b>";
                        }
                        if (actionsElement) {
                            actionsElement.innerHTML = '<span class="closed-item-status">Action Complete</span>';
                        }
						
						updateOrderStatusDisplay(data.orderStatus);

                        Swal.fire("Cancelled!", "The item has been successfully cancelled.", "success");
                    } else {
                        Swal.fire("Error!", data.message || "Could not cancel the item.", "error");
                    }
                } catch (error) {
                    Swal.fire("Network Error!", "Failed to connect to the server.", "error");
                }
            }
        } 
        
        if (returnItemBtn) {
            const orderId = returnItemBtn.dataset.orderId;
            const itemId = returnItemBtn.dataset.itemId;
            const row = returnItemBtn.closest('tr');
            
            const confirmation = await Swal.fire({
                title: "Return Item",
                input: "text",
                inputLabel: "Reason for returning this item:",
                inputPlaceholder: "e.g., Wrong size, Item damaged",
                text: "You are about to submit a return request for this item. Item must be Delivered.",
                icon: "question",
                showCancelButton: true,
                confirmButtonText: "Submit Return Request",
                cancelButtonText: "No, Keep it",
                inputValidator: (value) => {
                    if (!value) {
                        return "A reason is required to proceed with the return!";
                    }
                },
            });

            if (confirmation.isConfirmed) {
                const returnReason = confirmation.value;

                try {
                    const response = await fetch(`/order/item/return/${orderId}/${itemId}`, {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            status: "Returned",
                            reason: returnReason,
                        }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const statusElement = row.querySelector(".item-status");
                        const actionsElement = row.querySelector(".item-actions-cell");
                        
                        if (statusElement) {
                            statusElement.className = "item-status status-returned";
                            statusElement.innerHTML = `<b>RETURNED</b>`;
                        }

                        if (actionsElement) {
                            actionsElement.innerHTML = '<span class="closed-item-status">Action Complete</span>';
                        }
						
						updateOrderStatusDisplay(data.orderStatus);

                        Swal.fire(
                            "Return Requested!",
                            "Your item has been successfully marked for return.",
                            "success"
                        );
                    } else {
                        Swal.fire("Error!", data.message || "Could not process the item return.", "error");
                    }
                } catch (error) {
                    Swal.fire("Network Error!", "Failed to connect to the server.", "error");
                }
            }
        }
    });
}