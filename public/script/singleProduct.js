const navToProductDetailPage = document.querySelectorAll(".nav-to-product-detail-page");

function setBgColorForSpan() {
    const colorSpan = document.querySelectorAll(".color-option .item");

    colorSpan.forEach((span) => {
        // The color variable will contain the string like 'orange', 'grey', etc.
        const color = span.getAttribute("data-color").trim(); 
        // Set the actual background color using the data attribute value
        span.style.backgroundColor = color; 
    });
}
// Ensure this function is called once the DOM is ready
setBgColorForSpan(); 

navToProductDetailPage.forEach((article) => {
    const id = article.getAttribute("data-productid").trim();
    const variantid = article.getAttribute("data-variantid").trim();
    article.addEventListener("click", () => {
        window.location.href = `/products/${id}/${variantid}`;
    });
});

lucide.createIcons();