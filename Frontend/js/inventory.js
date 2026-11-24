// ======================================================
// MK ANIMAL HEALTH ERP
// INVENTORY MANAGEMENT
// ======================================================



// ======================================================
// PAGE LOAD ANIMATION
// ======================================================

window.addEventListener("load", () => {

    const cards = document.querySelectorAll(".inventory-card");

    cards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform = "translateY(30px)";

        setTimeout(() => {

            card.style.transition = "0.6s ease";

            card.style.opacity = "1";

            card.style.transform = "translateY(0)";

        }, index * 180);

    });

});



// ======================================================
// CARD HOVER EFFECT
// ======================================================

const cards = document.querySelectorAll(".inventory-card");

cards.forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-8px) scale(1.02)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "translateY(0) scale(1)";

    });

});



// ======================================================
// CARD CLICK EFFECT
// ======================================================

cards.forEach(card => {

    card.addEventListener("click", () => {

        card.style.opacity = "0.7";

        setTimeout(() => {

            card.style.opacity = "1";

        }, 200);

    });

});



// ======================================================
// FUTURE FEATURES
// ======================================================

// Future Additions:
//
// Search Products
//
// Filter Products
//
// Dashboard Statistics
//
// API Integration
//
// Notifications
//
// User Authentication
//
// Barcode Scanner
//
// Stock Alerts