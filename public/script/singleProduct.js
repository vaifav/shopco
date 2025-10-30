const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");

function setBgColorForSpan() {
	const colorSpan = document.querySelectorAll(".color-option .item");

	colorSpan.forEach((span) => {
		const color = span.getAttribute("data-color").trim();
		span.style.backgroundColor = color;
	});
}
setBgColorForSpan();

navToProductDetailPage.forEach((article) => {
	const id = article.getAttribute("data-productid").trim();
	const variantid = article.getAttribute("data-variantid").trim();
	article.addEventListener("click", () => {
		window.location.href = `/products/${id}/${variantid}`;
	});
});

lucide.createIcons();
