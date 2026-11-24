/*==================================================
    STOCK ANALYSIS PAGE
    PART 1
==================================================*/

"use strict";

/*==================================================
    DOM ELEMENTS
==================================================*/

// Search

const globalSearch = document.querySelector(".search-box input");

// Logout

const logoutButton = document.querySelector(".logout");

const logoutModal = document.getElementById("logoutModal");

const confirmLogout = document.getElementById("confirmLogout");

const cancelLogout = document.getElementById("cancelLogout");

// Stock Modal

const stockModal = document.getElementById("stockUpdateModal");

const closeStockModal = document.getElementById("closeStockModal");

const cancelStockUpdate = document.getElementById("cancelStockUpdate");

/*==================================================
    GLOBAL SEARCH
==================================================*/

if (globalSearch) {

    globalSearch.addEventListener("keyup", function () {

        console.log("Searching :", this.value);

    });

}

/*==================================================
    LOGOUT MODAL
==================================================*/

if (logoutButton) {

    logoutButton.addEventListener("click", () => {

        logoutModal.classList.add("active");

    });

}

if (cancelLogout) {

    cancelLogout.addEventListener("click", () => {

        logoutModal.classList.remove("active");

    });

}

if (logoutModal) {

    logoutModal.addEventListener("click", function (e) {

        if (e.target === logoutModal) {

            logoutModal.classList.remove("active");

        }

    });

}

if (confirmLogout) {

    confirmLogout.addEventListener("click", () => {

        // Change the page if required

        window.location.href = "../index.html";

    });

}

/*==================================================
    STOCK UPDATE MODAL
==================================================*/

if (closeStockModal) {

    closeStockModal.addEventListener("click", () => {

        stockModal.classList.remove("active");

    });

}

if (cancelStockUpdate) {

    cancelStockUpdate.addEventListener("click", () => {

        stockModal.classList.remove("active");

    });

}

if (stockModal) {

    stockModal.addEventListener("click", function (e) {

        if (e.target === stockModal) {

            stockModal.classList.remove("active");

        }

    });

}

/*==================================================
    ESC KEY SUPPORT
==================================================*/

document.addEventListener("keydown", function (e) {

    if (e.key === "Escape") {

        if (logoutModal) {

            logoutModal.classList.remove("active");

        }

        if (stockModal) {

            stockModal.classList.remove("active");

        }

    }

});

/*==================================================
    HELPER FUNCTIONS
==================================================*/

function showStockModal() {

    if (stockModal) {

        stockModal.classList.add("active");

    }

}

function hideStockModal() {

    if (stockModal) {

        stockModal.classList.remove("active");

    }

}

function formatDate() {

    return new Date().toLocaleDateString("en-IN", {

        day: "2-digit",

        month: "short",

        year: "numeric"

    });

}

console.log("Stock Analysis JS Loaded Successfully");
/*==================================================
    MONTHLY PRODUCT SALES CHART
    PART 2
==================================================*/

const monthlySalesCanvas = document.getElementById("monthlySalesChart");

if (monthlySalesCanvas) {

    const monthlySalesChart = new Chart(monthlySalesCanvas, {

        type: "bar",

        data: {

            labels: [

                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"

            ],

            datasets: [

                {

                    label: "Units Sold",

                    data: [

                        420,
                        510,
                        475,
                        620,
                        710,
                        680,
                        790,
                        860,
                        825,
                        905,
                        980,
                        1120

                    ],

                    backgroundColor: "#2563eb",

                    borderRadius: 8,

                    borderSkipped: false,

                    hoverBackgroundColor: "#1d4ed8"

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: {

                duration: 1200,

                easing: "easeOutQuart"

            },

            plugins: {

                legend: {

                    display: true,

                    position: "top",

                    labels: {

                        color: "#374151",

                        font: {

                            family: "Poppins",

                            size: 13,

                            weight: "600"

                        }

                    }

                },

                tooltip: {

                    backgroundColor: "#1f2937",

                    titleColor: "#ffffff",

                    bodyColor: "#ffffff",

                    cornerRadius: 8,

                    padding: 12

                }

            },

            scales: {

                x: {

                    grid: {

                        display: false

                    },

                    ticks: {

                        color: "#6b7280",

                        font: {

                            family: "Poppins"

                        }

                    }

                },

                y: {

                    beginAtZero: true,

                    grid: {

                        color: "#e5e7eb"

                    },

                    ticks: {

                        color: "#6b7280",

                        stepSize: 200,

                        font: {

                            family: "Poppins"

                        }

                    }

                }

            }

        }

    });

}
/*==================================================
    TOP SELLING PRODUCTS CHART
    PART 3
==================================================*/

const topProductsCanvas = document.getElementById("topProductsChart");

if (topProductsCanvas) {

    const topProductsChart = new Chart(topProductsCanvas, {

        type: "doughnut",

        data: {

            labels: [

                "AI Care",
                "Liv Plus",
                "Super Boost",
                "Calf Boost",
                "Ultra Care",
                "Others"

            ],

            datasets: [

                {

                    data: [

                        24,
                        18,
                        16,
                        14,
                        12,
                        16

                    ],

                    backgroundColor: [

                        "#2563eb",
                        "#16a34a",
                        "#f59e0b",
                        "#7c3aed",
                        "#dc2626",
                        "#94a3b8"

                    ],

                    borderColor: "#ffffff",

                    borderWidth: 3,

                    hoverOffset: 12

                }

            ]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            cutout: "65%",

            animation: {

                animateRotate: true,

                animateScale: true,

                duration: 1200,

                easing: "easeOutQuart"

            },

            plugins: {

                legend: {

                    position: "bottom",

                    labels: {

                        color: "#374151",

                        padding: 18,

                        boxWidth: 16,

                        font: {

                            family: "Poppins",

                            size: 13,

                            weight: "500"

                        }

                    }

                },

                tooltip: {

                    backgroundColor: "#1f2937",

                    titleColor: "#ffffff",

                    bodyColor: "#ffffff",

                    cornerRadius: 8,

                    padding: 12,

                    callbacks: {

                        label: function (context) {

                            return context.label + " : " + context.parsed + "%";

                        }

                    }

                }

            }

        }

    });

}
/*==================================================
    INVENTORY TABLE FUNCTIONALITY
    PART 4
==================================================*/

/*==================================================
    TABLE SEARCH
==================================================*/

const tableSearch = document.querySelector(".table-search input");
const tableRows = document.querySelectorAll(".inventory-table tbody tr");

if (tableSearch) {

    tableSearch.addEventListener("keyup", function () {

        const value = this.value.toLowerCase().trim();

        tableRows.forEach(row => {

            const text = row.innerText.toLowerCase();

            row.style.display = text.includes(value) ? "" : "none";

        });

    });

}

/*==================================================
    STATUS FILTER
==================================================*/

const statusFilter = document.querySelector(".table-actions select");

if (statusFilter) {

    statusFilter.addEventListener("change", function () {

        const selected = this.value.toLowerCase();

        tableRows.forEach(row => {

            const statusElement = row.querySelector(".status");

            if (!statusElement) return;

            const status = statusElement.textContent.toLowerCase();

            if (

                selected === "all" ||

                status === selected

            ) {

                row.style.display = "";

            }

            else {

                row.style.display = "none";

            }

        });

    });

}

/*==================================================
    UPDATE STOCK BUTTON
==================================================*/

const updateButtons = document.querySelectorAll(".update-btn");

updateButtons.forEach(button => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        if (!row) return;

        const productName = row.cells[0].textContent.trim();

        const stock = row.cells[3].textContent.trim();

        const productField = document.getElementById("productName");

        const stockField = document.getElementById("currentStock");

        const quantityField = document.getElementById("updateQuantity");

        const remarksField = document.getElementById("remarks");

        const typeField = document.getElementById("updateType");

        if (productField) productField.value = productName;

        if (stockField) stockField.value = stock;

        if (quantityField) quantityField.value = "";

        if (remarksField) remarksField.value = "";

        if (typeField) typeField.selectedIndex = 0;

        showStockModal();

    });

});

/*==================================================
    FORM SUBMISSION
==================================================*/

const stockUpdateForm = document.getElementById("stockUpdateForm");

if (stockUpdateForm) {

    stockUpdateForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const quantity = document.getElementById("updateQuantity").value;

        if (quantity === "" || Number(quantity) <= 0) {

            alert("Please enter a valid quantity.");

            return;

        }

        alert("Stock updated successfully.");

        hideStockModal();

    });

}
/*==================================================
    FINAL FEATURES
    PART 5
==================================================*/

/*==================================================
    VIEW PRODUCT
==================================================*/

const viewButtons = document.querySelectorAll(".view-btn");

viewButtons.forEach(button => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        if (!row) return;

        const product = row.cells[0].textContent;
        const batch = row.cells[1].textContent;
        const category = row.cells[2].textContent;
        const stock = row.cells[3].textContent;
        const price = row.cells[4].textContent;
        const status = row.cells[5].textContent;

        alert(

`Product : ${product}

Batch : ${batch}

Category : ${category}

Stock : ${stock}

Price : ₹${price}

Status : ${status}`

        );

    });

});

/*==================================================
    EDIT PRODUCT
==================================================*/

const editButtons = document.querySelectorAll(".edit-btn");

editButtons.forEach(button => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        if (!row) return;

        alert("Edit feature will be connected to Product Management.");

    });

});

/*==================================================
    DELETE PRODUCT
==================================================*/

const deleteButtons = document.querySelectorAll(".delete-btn");

deleteButtons.forEach(button => {

    button.addEventListener("click", function () {

        const row = this.closest("tr");

        if (!row) return;

        const product = row.cells[0].textContent;

        const confirmation = confirm(

            `Delete "${product}" from inventory?`

        );

        if (confirmation) {

            row.remove();

        }

    });

});

/*==================================================
    EXPORT INVENTORY
==================================================*/

const exportButton = document.querySelector(".btn-export");

if (exportButton) {

    exportButton.addEventListener("click", () => {

        let csv = [];

        const rows = document.querySelectorAll(".inventory-table tr");

        rows.forEach(row => {

            const cols = row.querySelectorAll("th,td");

            let data = [];

            cols.forEach((col, index) => {

                if (index < 7) {

                    data.push(

                        `"${col.innerText.replace(/\n/g, " ")}"`

                    );

                }

            });

            csv.push(data.join(","));

        });

        const csvFile = new Blob(

            [csv.join("\n")],

            {

                type: "text/csv"

            }

        );

        const downloadLink = document.createElement("a");

        downloadLink.download = "Inventory_Report.csv";

        downloadLink.href = URL.createObjectURL(csvFile);

        document.body.appendChild(downloadLink);

        downloadLink.click();

        document.body.removeChild(downloadLink);

    });

}

/*==================================================
    KPI COUNTER ANIMATION
==================================================*/

function animateCounter(element, target) {

    let count = 0;

    const speed = Math.max(10, Math.floor(target / 40));

    const interval = setInterval(() => {

        count += speed;

        if (count >= target) {

            count = target;

            clearInterval(interval);

        }

        element.textContent = count;

    }, 30);

}

const counterElements = document.querySelectorAll(".card-details h2");

counter