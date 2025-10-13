import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const citySelect = document.querySelector("#manage-address #city");
const stateSelect = document.querySelector("#manage-address #state");
const formAddress = document.querySelector("#add-or-edit-address");
const formOverlay = document.querySelector("#manage-address .overlay");
const countrySelect = document.querySelector("#manage-address #country");
const addNewAddress = document.querySelector("#manage-address .add-new-address-btn");
const editAddress = document.querySelectorAll("#manage-address article button.edit");
const deleteAddress = document.querySelectorAll("#manage-address article button.delete");

const { states, cities, addresses } = window.accountData;

function populateStates(countryCode, statesArray, stateSelectElement) {
	stateSelectElement.innerHTML = '<option value="" disabled selected>Select State</option>';
	statesArray
		.filter((s) => s.countryCode === countryCode)
		.forEach((s) => {
			const opt = document.createElement("option");
			opt.value = s.isoCode;
			opt.textContent = s.name;
			stateSelectElement.appendChild(opt);
		});
}

function populateCities(countryCode, stateCode, citiesArray, citySelectElement) {
	citySelectElement.innerHTML = '<option value="" disabled selected>Select City</option>';
	citiesArray
		.filter((c) => c.countryCode === countryCode && c.stateCode === stateCode)
		.forEach((c) => {
			const opt = document.createElement("option");
			opt.value = c.name;
			opt.textContent = c.name;
			citySelectElement.appendChild(opt);
		});
}

function handleAddressSubmit(form, url, method, overlay) {
	form.onsubmit = async (e) => {
		e.preventDefault();

		const data = {
			fullName: document.getElementById("fullName").value.trim(),
			phone: document.getElementById("address-phone").value.trim(),
			street: document.getElementById("street").value.trim(),
			city: document.getElementById("city").value.trim(),
			state: document.getElementById("state").value.trim(),
			pin: document.getElementById("pin").value.trim(),
			houseName: document.getElementById("houseName").value.trim(),
			country: document.getElementById("country").value.trim(),
		};

		try {
			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				await Swal.fire({
					icon: "error",
					title: "Failed!",
					text: result.message || "Something went wrong. Please try again.",
					confirmButtonColor: "#d33",
				});
				window.location.href = "/account#manage-address";
				return;
			}

			await Swal.fire({
				icon: "success",
				title: method === "POST" ? "Address Added!" : "Address Updated!",
				text: result.message || "Your address has been saved successfully.",
				showConfirmButton: false,
				timer: 1500,
			});
			window.location.href = "/account";
		} catch (err) {
			console.error("Error submitting form:", err);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while saving your address.",
				confirmButtonColor: "#d33",
			});
		} finally {
			form.reset();
			overlay.classList.remove("active");
		}
	};
}

countrySelect.addEventListener("change", (e) => {
	const countryCode = e.target.value;
	citySelect.innerHTML = '<option value="" disabled selected>Select City</option>';
	populateStates(countryCode, states, stateSelect);
});

stateSelect.addEventListener("change", (e) => {
	const stateCode = e.target.value;
	const countryCode = countrySelect.value;
	populateCities(countryCode, stateCode, cities, citySelect);
});

document.querySelector("#manage-address form .cancel").addEventListener("click", () => {
	formOverlay.classList.remove("active");
});

editAddress.forEach((btn) => {
	btn.addEventListener("click", () => {
		formOverlay.classList.add("active");

		const id = btn.getAttribute("data-addressid");
		const address = addresses.find((a) => a._id === id);
		if (!address) return;

		document.querySelectorAll("#manage-address #country option").forEach((opt) => {
			opt.selected = opt.value === address.country;
		});

		populateStates(address.country, states, stateSelect);
		document.querySelectorAll("#manage-address #state option").forEach((opt) => {
			opt.selected = opt.value === address.state;
		});

		populateCities(address.country, address.state, cities, citySelect);
		document.querySelectorAll("#manage-address #city option").forEach((opt) => {
			opt.selected = opt.value === address.city;
		});

		document.getElementById("fullName").value = address.fullName;
		(document.getElementById("address-phone").value = address.phone), (document.getElementById("pin").value = address.pin);
		document.getElementById("houseName").value = address.houseName;
		document.getElementById("street").value = address.street;

		handleAddressSubmit(formAddress, `/account/manageaddress/edit/${id}`, "PATCH", formOverlay);
	});
});

deleteAddress.forEach((btn) => {
	btn.addEventListener("click", async () => {
		const id = btn.getAttribute("data-addressid").trim();
		const address = addresses.find((a) => a._id === id);
		if (!address) return;

		const confirmResult = await Swal.fire({
			title: "Are you sure?",
			text: "This action will permanently delete your address!",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#3085d6",
			confirmButtonText: "Yes, delete it!",
			cancelButtonText: "Cancel",
		});

		if (!confirmResult.isConfirmed) return;

		try {
			const res = await fetch(`/account/manageaddress/delete/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
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
				title: "Address Deleted",
				text: result.message || "Your address has been deleted successfully.",
				showConfirmButton: false,
				timer: 1500,
			});

			window.location.href = "/account";
		} catch (err) {
			console.error("Error submitting form:", err);
			await Swal.fire({
				icon: "error",
				title: "Error!",
				text: "Something went wrong while deleting your address.",
				confirmButtonColor: "#d33",
			});
		}
	});
});

addNewAddress.addEventListener("click", async () => {
	formOverlay.classList.add("active");
	handleAddressSubmit(formAddress, `/account/manageaddress/add`, "POST", formOverlay);
});
