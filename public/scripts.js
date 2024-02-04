// public/scripts.js
// Hide and show the fixed navbar on scroll
let prevScrollPos = window.pageYOffset;

window.onscroll = function() {
    const currentScrollPos = window.pageYOffset;

    if (prevScrollPos > currentScrollPos) {
        // Scroll up, show the navbar
        document.querySelector(".fixed-navbar").style.display = "block";
    } else {
        // Scroll down, hide the navbar
        document.querySelector(".fixed-navbar").style.display = "none";
    }

    prevScrollPos = currentScrollPos;
};
