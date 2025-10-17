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
			window.location.href = `/admin/customers`;
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

