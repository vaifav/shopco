import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
const smallImageFigures = document.querySelectorAll(".product-images aside figure");
const mainImageElement = document.querySelector(".product-container .product-images > figure img");
const mainImageFigure = document.querySelector(".product-container .product-images > figure");
const colorOptions = document.querySelectorAll('input[name="color"]');
const sizeOptions = document.querySelectorAll('input[name="size"]');
const countInput = document.getElementById("count");
const addToCartButton = document.querySelector(".add-to-cart");

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

function updateAddToCartButtonData() {
	const selectedColor = document.querySelector('input[name="color"]:checked');
	const colorValue = selectedColor ? selectedColor.value.toLowerCase() : "";

	const selectedSize = document.querySelector('input[name="size"]:checked');
	const sizeValue = selectedSize ? selectedSize.value.toLowerCase() : "";

	const countValue = countInput.value.toLowerCase();

	addToCartButton.setAttribute("data-color", colorValue);
	addToCartButton.setAttribute("data-size", sizeValue);
	addToCartButton.setAttribute("data-count", countValue);
}

colorOptions.forEach((radio) => {
	radio.addEventListener("change", updateAddToCartButtonData);
});

sizeOptions.forEach((radio) => {
	radio.addEventListener("change", updateAddToCartButtonData);
});

countInput.addEventListener("input", updateAddToCartButtonData);
countInput.addEventListener("change", updateAddToCartButtonData);

updateAddToCartButtonData();

addToCartButton.addEventListener("click", async (event) => {
	const button = event.currentTarget;

	const variantId = button.dataset.variantid;
	const color = button.dataset.color;
	const size = button.dataset.size;
	const count = button.dataset.count;

	const productData = {
		variantId: variantId,
		color: color,
		size: size,
		count: count,
	};

	try {
		const res = await fetch("/cart", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				productData,
			}),
		});
		const result = await res.json();
		if (!res.ok || !result.success) {
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: result.message,
				confirmButtonColor: "#d33",
			});
			return;
		}

		await Swal.fire({
			icon: "success",
			title: "Item Added to cart",
			text: result.message,
			showConfirmButton: false,
			timer: 1500,
		});
	} catch (error) {
		console.log(error);
		await Swal.fire({
			icon: "error",
			title: "Failed!",
			text: result.message,
			confirmButtonColor: "#d33",
		});
		return;
	}

	console.log(productData);
});

lucide.createIcons();
