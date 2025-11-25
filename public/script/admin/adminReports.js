function addOrUpdateQueryParams(params) {
	const url = new URL(window.location.href);
	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			if (params[key] === "" || params[key] === null || params[key] === undefined) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, params[key]);
			}
		}
	}
	window.history.pushState({}, "", url.toString());
	window.location.reload();
}

const formatDate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

function getRangeDates(range) {
	const now = new Date();
	const endDate = formatDate(now);
	let startDate = null;
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (range) {
		case "daily":
			const oneDayAgo = new Date(today);
			oneDayAgo.setDate(today.getDate() - 1);
			startDate = formatDate(oneDayAgo);
			break;
		case "weekly":
			const sevenDaysAgo = new Date(today);
			sevenDaysAgo.setDate(today.getDate() - 7);
			startDate = formatDate(sevenDaysAgo);
			break;
		case "monthly":
			const thirtyDaysAgo = new Date(today);
			thirtyDaysAgo.setDate(today.getDate() - 30);
			startDate = formatDate(thirtyDaysAgo);
			break;
		case "yearly":
			const oneYearAgo = new Date(today);
			oneYearAgo.setDate(today.getDate() - 365);
			startDate = formatDate(oneYearAgo);
			break;
	}

	return { startDate, endDate };
}

document.addEventListener("DOMContentLoaded", () => {
	const filterButtons = document.querySelectorAll(".filter-btn");
	const dateRangeForm = document.querySelector(".date-range-form");
	const startDateInput = document.getElementById("start-date");
	const endDateInput = document.getElementById("end-date");
	const currentUrl = new URL(window.location.href);
	const urlStartDate = currentUrl.searchParams.get("startDate");
	const urlEndDate = currentUrl.searchParams.get("endDate");

	const pdfBtn = document.querySelector("header button");

	const todayFormatted = formatDate(new Date());
	startDateInput.setAttribute("max", todayFormatted);
	endDateInput.setAttribute("max", todayFormatted);

	if (dateRangeForm) {
		dateRangeForm.addEventListener("submit", (e) => {
			e.preventDefault();
			const newStartDate = startDateInput.value;
			const newEndDate = endDateInput.value;

			if (newStartDate && newEndDate) {
				addOrUpdateQueryParams({ startDate: newStartDate, endDate: newEndDate });
			} else {
				addOrUpdateQueryParams({ startDate: null, endDate: null });
			}
		});
	}

	if (filterButtons.length > 0) {
		filterButtons.forEach((button) => {
			button.addEventListener("click", () => {
				const range = button.getAttribute("data-range");
				const { startDate, endDate } = getRangeDates(range);

				addOrUpdateQueryParams({ startDate: startDate, endDate: endDate });
			});
		});
	}

	if (urlStartDate && urlEndDate) {
		startDateInput.value = urlStartDate;
		endDateInput.value = urlEndDate;

		filterButtons.forEach((button) => button.classList.remove("active"));

		let matchFound = false;
		filterButtons.forEach((button) => {
			const range = button.getAttribute("data-range");
			const { startDate: expectedStart, endDate: expectedEnd } = getRangeDates(range);

			if (urlStartDate === expectedStart && urlEndDate === expectedEnd) {
				button.classList.add("active");
				matchFound = true;
			}
		});

		if (!matchFound) {
			filterButtons.forEach((button) => button.classList.remove("active"));
		}
	} else {
		const dailyButton = document.querySelector('.filter-btn[data-range="daily"]');
		if (dailyButton) {
			dailyButton.classList.add("active");
		}
	}

	if (pdfBtn) {
		pdfBtn.addEventListener("click", (e) => {
			e.preventDefault();

			const finalStartDate = startDateInput.value;
			const finalEndDate = endDateInput.value;

			let downloadUrl = "/admin/reports/pdf";

			if (finalStartDate && finalEndDate) {
				downloadUrl += `?startDate=${finalStartDate}&endDate=${finalEndDate}`;
			}

			window.location.href = downloadUrl;
		});
	}
});
