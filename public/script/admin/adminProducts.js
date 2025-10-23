const addProductBtn = document.querySelector("#products header button");
const searchForm = document.querySelector("#products .products-search form");
const activeFilter = document.querySelector(
	"#products .products-search .active-block-filter .active"
);
const blockedFilter = document.querySelector(
	"#products .products-search .active-block-filter .blocked"
);
const edit = document.querySelectorAll("#products .action-btn.edit-btn");

addProductBtn.addEventListener("click", (e) => {
	window.location.pathname = "/admin/products/action";
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
	const arrow = document.querySelector("#products .products-search .up-down");

	arrow.addEventListener("click", () => {
		const url = new URL(window.location.href);
		let val = parseInt(url.searchParams.get("createdAt")) || -1;

		val = val === -1 ? 1 : -1;
		url.searchParams.set("createdAt", val);

		window.location.href = url.toString();
	});
};
createdAtFilterToggle();

searchForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let search = searchForm.querySelector("input#adn-search").value;
	addOrUpdateQueryParams({ search: search });
});

edit.forEach((btn) => {
	btn.addEventListener("click", () => {
		const id = btn.getAttribute("data-id").trim();
		window.location.href = `/admin/products/action/${id}`;
	});
});
