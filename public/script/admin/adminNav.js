const navElement = document.querySelector("nav ul");

navElement.addEventListener("click", function (e) {
	const listItem = e.target.closest("li");
	if (listItem && listItem.dataset.url) {
		e.preventDefault();
		window.location.href = listItem.dataset.url;
	}
});

lucide.createIcons();
