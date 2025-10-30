const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
const filterHeads = document.querySelectorAll(".filter .head");
const search = document.querySelector(".header nav form");
const filterDropDownCategory = document.querySelectorAll("ul.filter-drop-down li");
const filterDropDownSize = document.querySelectorAll("ul.size-drop-down li");
const clearFilterBtn = document.querySelector(".clear-filter-btn");
const priceForm = document.querySelector("aside form");
const minPriceInput = document.getElementById("price-range-start");
const maxPriceInput = document.getElementById("price-range-end");
const categoryHeading = document.querySelector(".category-heading");

filterHeads.forEach((head) => {
	head.addEventListener("click", () => {
		const filterSection = head.closest(".filter");
		if (filterSection) {
			filterSection.classList.toggle("active");
		}
	});
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

const sortToggle = (event, field, element, initVal) => {
	const fieldArr = ["price"];
	let index = fieldArr.indexOf(field);

	if (index > -1) fieldArr.splice(index, 1);

	const btn = document.querySelector(element);

	btn.addEventListener(event, () => {
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

sortToggle("change", "price", ".sort-section #sortby", -1);

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

search.addEventListener("submit", (e) => {
	e.preventDefault();
	const value = search.querySelector("input").value.toString();
	addOrUpdateQueryParams({ search: value });
});

filterDropDownCategory.forEach((li) => {
	const value = li.getAttribute("data-categoryid").trim();
	li.addEventListener("click", () => {
		addOrUpdateQueryParams({ category: value });
	});
});

filterDropDownSize.forEach((li) => {
	const size = li.getAttribute("data-size").trim();
	li.addEventListener("click", () => {
		addOrUpdateQueryParams({ size });
	});
});

function activeCategoryName() {
	const urlParams = new URLSearchParams(window.location.search);
	const categoryId = urlParams.get("category") || "";

	const currentLi = Array.from(filterDropDownCategory).find(
		(li) => li.getAttribute("data-categoryid").trim() === categoryId
	);

	categoryHeading.innerHTML = currentLi.textContent;
}
activeCategoryName();

function activeSizeBtn() {
	const urlParams = new URLSearchParams(window.location.search);
	const currentSize = urlParams.get("size") || "";
	const activeItem = document.querySelector(`.size-drop-down li[data-size="${currentSize}"]`);
	filterDropDownSize.forEach((item) => {
		item.classList.remove("active");
	});

	if (activeItem) {
		activeItem.classList.add("active");
	}
}
activeSizeBtn();

priceForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const minPriceValue = minPriceInput.value.trim();
	const maxPriceValue = maxPriceInput.value.trim();

	addOrUpdateQueryParams({ minprice: minPriceValue, maxprice: maxPriceValue });
});

clearFilterBtn.addEventListener("click", () => {
	window.location.href = "/products";
});

navToProductDetailPage.forEach((article) => {
	const id = article.getAttribute("data-productid").trim();
	const variantid = article.getAttribute("data-variantid").trim();
	article.addEventListener("click", () => {
		window.location.href = `/products/${id}/${variantid}`;
	});
});

lucide.createIcons();
