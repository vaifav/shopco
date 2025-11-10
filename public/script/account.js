const navElement = document.querySelector(".container nav ul");
const sections = document.querySelectorAll(".sections section");

function showSection(id) {
	sections.forEach((section) => {
		section.classList.toggle("show", section.id === id);
	});
}

navElement.addEventListener("click", function (e) {
	
	const listItem = e.target.closest("li");
	if (listItem && listItem.dataset.url) {
		e.preventDefault();
		window.location.href = listItem.dataset.url;
	}
});

lucide.createIcons();
