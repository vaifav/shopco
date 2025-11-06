const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
const smallImageFigures = document.querySelectorAll(".product-images aside figure");
const mainImageElement = document.querySelector(".product-container .product-images > figure img");
const mainImageFigure = document.querySelector(".product-container .product-images > figure");

function setBgColorForSpan() {
	const colorSpan = document.querySelectorAll(".color-option .item");

	colorSpan.forEach((span) => {
		const color = span.getAttribute("data-color").trim();
		span.style.backgroundColor = color;
	});
}
setBgColorForSpan();

smallImageFigures.forEach((smallFigure) => {
	smallFigure.addEventListener("click", () => {
		const newSrc = smallFigure.querySelector("img").getAttribute("src");

		mainImageElement.setAttribute("src", newSrc);
		mainImageElement.style.transform = "scale(1)";
		mainImageElement.style.transformOrigin = "center center";

		smallImageFigures.forEach((fig) => {
			fig.style.borderColor = "transparent";
			fig.style.opacity = "0.8";
		});

		smallFigure.style.borderColor = "#333";
		smallFigure.style.opacity = "1";
	});
});

if (smallImageFigures.length > 0) {
	smallImageFigures[0].style.borderColor = "#333";
	smallImageFigures[0].style.opacity = "1";
}

if (mainImageFigure) {
	mainImageFigure.addEventListener("mousemove", (e) => {
		const x = e.offsetX;
		const y = e.offsetY;
		mainImageElement.style.transformOrigin = `${x}px ${y}px`;
		mainImageElement.style.transform = "scale(2.5)";
	});

	mainImageFigure.addEventListener("mouseout", () => {
		mainImageElement.style.transform = "scale(1)";
		mainImageElement.style.transformOrigin = "center center";
	});
}

navToProductDetailPage.forEach((article) => {
	const id = article.getAttribute("data-productid").trim();
	const variantid = article.getAttribute("data-variantid").trim();
	article.addEventListener("click", () => {
		window.location.href = `/products/${id}/${variantid}`;
	});
});

function navByColor() {
	const colorSpan = document.querySelectorAll(".color-option .item");

	colorSpan.forEach((span) => {
		const id = span.getAttribute("data-productid").trim();
		const vrId = span.getAttribute("data-variantid").trim();
		const color = span.getAttribute("data-color").trim();
		span.addEventListener("click", () => {
			window.location.href = `/products/${id}/${vrId}/${color}`;
		});
	});
}
navByColor();

lucide.createIcons();
