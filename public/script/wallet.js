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

function addOrUpdateQueryParams(params) {
	const url = new URL(window.location.href);
	for (const key in params) {
		if (params.hasOwnProperty(key)) {
			if (params[key] === "" || params[key] === null) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(key, params[key]);
			}
		}
	}
	window.history.pushState({}, "", url.toString());
	window.location.reload();
}
