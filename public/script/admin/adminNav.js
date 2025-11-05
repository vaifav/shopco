const navElement = document.querySelector("#admin-nav ul");
const adminNav = document.getElementById("admin-nav");
const chevron = document.getElementById("admin-menu-chevron");
const sections = document.querySelector(".sections");

const toggleSidebar = () => {
	adminNav.classList.toggle("active");
	chevron.classList.toggle("active");

	if (window.innerWidth > 768) {
		adminNav.classList.toggle("collapsed");
		sections.classList.toggle("collapsed");
	}
};

if (chevron) {
	chevron.addEventListener("click", toggleSidebar);
}

const initializeSidebar = () => {
	if (window.innerWidth > 1040) {
		adminNav.classList.add("collapsed");
		sections.classList.add("collapsed");
		chevron.classList.add("active");
	} else {
		adminNav.classList.remove("active");
		chevron.classList.remove("active");
	}
};

window.addEventListener("resize", initializeSidebar);
initializeSidebar();

navElement.addEventListener("click", function (e) {
	const listItem = e.target.closest("li");
	if (listItem && listItem.dataset.url) {
		e.preventDefault();
		window.location.href = listItem.dataset.url;
	}
});

lucide.createIcons();
