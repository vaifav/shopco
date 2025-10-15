const navItems = document.querySelectorAll(".container nav ul li");
const sections = document.querySelectorAll(".sections section");

function showSection(id) {
	sections.forEach((section) => {
		section.classList.toggle("show", section.id === id);
	});
}

navItems.forEach((item) => {
	item.addEventListener("click", (e) => {
		e.preventDefault();

		navItems.forEach((i) => i.classList.remove("active"));
		item.classList.add("active");

		const link = item.querySelector("a");
		const targetId = link.getAttribute("href").substring(1);

		showSection(targetId);
	});
});

if (sections.length > 0) {
	showSection(sections[0].id);
}

lucide.createIcons();
