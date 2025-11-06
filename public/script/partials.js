import Swal from "https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/+esm";

const account = document.querySelector(".header .icons .account");
const accountDropdown = document.querySelector(".header .account-dropdown");
const createaccount = document.querySelector(".header .account-dropdown .create-account");

account.addEventListener("click", () => {
    accountDropdown.classList.toggle("deactive");
    accountDropdown.classList.toggle("active");
    
    if (document.querySelector(".wrapper.header").classList.contains("mobile-menu-open")) {
        toggleMobileMenu();
    }
});

createaccount.addEventListener("click", (e) => {
    e.preventDefault();
    let timerInterval;
    Swal.fire({
        title:
            "<h5 style='font-size: 1.1rem; font-weight: 600;'> To Create a New Account, Please Logout first </h5>",
        html: "Close in <b></b> second.",
        timer: 5000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
            const timer = Swal.getPopup().querySelector("b");
            timerInterval = setInterval(() => {
                timer.textContent = `${parseInt(Swal.getTimerLeft() / 1000)}`;
            }, 100);
        },
        willClose: () => {
            clearInterval(timerInterval);
        },
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            console.log("I was closed by the timer");
        }
    });
});

const fetchUsername = async () => {
    const res = await fetch("/username");
    const data = await res.json();
    if (data.username) {
        accountDropdown.querySelector("h2.username").innerHTML = `Hello, ${data.username}`;
    }
};
fetchUsername();

const headerWrapper = document.querySelector(".wrapper.header");
const menuToggle = document.querySelector(".menu-toggle");
const menuIcon = menuToggle.querySelector('[data-lucide]'); 

const toggleMobileMenu = () => {
    headerWrapper.classList.toggle("mobile-menu-open");
    
    const open = headerWrapper.classList.contains("mobile-menu-open");
    menuIcon.setAttribute("data-lucide", open ? "x" : "menu");
    
    lucide.createIcons();
};

menuToggle.addEventListener("click", toggleMobileMenu);

const mainNavLinks = document.querySelectorAll(".main-nav-container a");
mainNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
        if (headerWrapper.classList.contains("mobile-menu-open")) {
            toggleMobileMenu(); 
        }
    });
});

lucide.createIcons()