import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");
const smallImageFigures = document.querySelectorAll(".product-images aside figure");
const mainImageElement = document.querySelector(".product-container .product-images > figure img");
const mainImageFigure = document.querySelector(".product-container .product-images > figure");
const colorOptions = document.querySelectorAll('input[name="color"]');
const sizeOptions = document.querySelectorAll('input[name="size"]');
const countInput = document.getElementById("count");
const addToCartButton = document.querySelector(".add-to-cart");
const fav = document.querySelector(".favorite-icon");

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
		fav.classList.toggle("fav");
		return;
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

const urlParams = new URLSearchParams(window.location.search);
const errorMessage = urlParams.get("error");

if (errorMessage) {
	const decodedMessage = decodeURIComponent(errorMessage);
	Swal.fire({
		icon: "error",
		title: "Order Failed",
		text: `We couldn't place your order. Reason: ${decodedMessage}`,
		confirmButtonText: "OK",
		confirmButtonColor: "#d33",
	}).then(() => {
		const newUrl = window.location.pathname;
		window.history.replaceState({}, document.title, newUrl);
	});
}

fav.addEventListener("click", async () => {
	const variantid = fav.getAttribute("data-variantid").trim();
	const isCurrentlyFavorite = fav.classList.contains("fav");

	const method = isCurrentlyFavorite ? "DELETE" : "POST";
	const url = isCurrentlyFavorite ? `/wishlist/${variantid}` : "/wishlist";
	const actionText = method === "POST" ? "Item moved to wishlist" : "Item removed from wishlist";

	const requestOptions = {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: method === "POST" ? JSON.stringify({ variantId: variantid }) : null,
	};

	fav.classList.toggle("fav");
	try {
		const res = await fetch(url, requestOptions);
		console.log(res);

		if (res.status === 401 || res.redirected) {
			await Swal.fire({
				icon: "info",
				title: "Login Required",
				text: "Please log in or create an account to save items to your wishlist.",
				confirmButtonText: "Go to Login",
				showCancelButton: true,
				cancelButtonText: "Cancel",
			}).then((result) => {
				if (result.isConfirmed) {
					window.location.href = "/login";
				}
			});
			fav.classList.toggle("fav");
			return;
		}

		const result = await res.json();
		if (!res.ok || !result.success) {
			await Swal.fire({
				icon: "error",
				title: "Failed!",
				text: result.message || "An unknown error occurred.",
				confirmButtonColor: "#d33",
			});
			fav.classList.toggle("fav");
			return;
		}

		await Swal.fire({
			icon: "success",
			title: actionText,
			text: result.message,
			showConfirmButton: false,
			timer: 1500,
		});
		return;
	} catch (error) {
		console.error(error);
		await Swal.fire({
			icon: "error",
			title: "Failed!",
			text: "Could not connect to the server or process the request.",
			confirmButtonColor: "#d33",
		});
		fav.classList.toggle("fav");
		return;
	}
});

lucide.createIcons();
