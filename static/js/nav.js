// Navigation


/* select elements */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

/* open / close mobile menu */
menuToggle.addEventListener("click", () => {

  // toggle class to show menu
  navLinks.classList.toggle("active");

});
