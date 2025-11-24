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
