const navItems = document.querySelectorAll(".container nav ul li");
const sections = document.querySelectorAll(".sections section");

navItems.forEach((item) => {
	item.addEventListener("click", (e) => {
		e.preventDefault();

		navItems.forEach((i) => i.classList.remove("active"));
		item.classList.add("active");

		const link = item.querySelector("a");
		const targetId = link.getAttribute("href").substring(1);
	});
});

function goToendPoint(e) {
	window.location.href = `${e.dataset.url}`;
}

lucide.createIcons();
