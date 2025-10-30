const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
navToProductDetailPage.forEach((article) => {
	const id = article.getAttribute("data-productid").trim();
	const variantid = article.getAttribute("data-variantid").trim();
	article.addEventListener("click", () => {
		window.location.href = `/products/${id}/${variantid}`;
	});
});

const category = document.querySelectorAll(".category-section");
category.forEach((c) => {
	const id = c.getAttribute("data-categoryid").trim();
	c.addEventListener("click", () => {
		window.location.href = `/products?category=${id}`;
	});
});
lucide.createIcons();
