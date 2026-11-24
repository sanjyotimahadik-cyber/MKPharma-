/* ==========================================
   TARGET TRACKING
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       ELEMENTS
    ============================== */

    const searchInput = document.getElementById("targetSearch");

    const monthFilter = document.getElementById("targetMonth");

    const statusFilter = document.getElementById("targetStatus");

    const table = document.querySelector(".target-table");

    const rows = table.querySelectorAll("tbody tr");

    const viewButtons = document.querySelectorAll(".view-btn");

    const modal = document.getElementById("targetModal");

    const closeModal = document.getElementById("closeModal");


    /* ==============================
       SEARCH TARGET
    ============================== */

    function searchTarget() {

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        rows.forEach(row => {

            const rowText = row.textContent
                .toLowerCase();

            if (rowText.includes(keyword)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }

    searchInput.addEventListener("keyup", searchTarget);


    /* ==============================
       PART 2 CONTINUES BELOW
    ============================== */
        /* ==============================
       COMBINED FILTERS
    ============================== */

    function applyFilters() {

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        const selectedMonth = monthFilter.value;

        const selectedStatus = statusFilter.value
            .toLowerCase();

        rows.forEach(row => {

            const rowText = row.textContent
                .toLowerCase();

            const startDate = row.cells[3]
                .textContent
                .trim();

            const rowStatus = row.cells[5]
                .textContent
                .trim()
                .toLowerCase();

            let searchMatch = rowText.includes(keyword);

            let monthMatch = true;

            let statusMatch = true;


            /* ==============================
               MONTH FILTER
            ============================== */

            if (selectedMonth !== "") {

                const selected = new Date(selectedMonth + "-01");

                const row = new Date(startDate);

                monthMatch =
                    selected.getMonth() === row.getMonth() &&
                    selected.getFullYear() === row.getFullYear();

            }


            /* ==============================
               STATUS FILTER
            ============================== */

            if (selectedStatus !== "all") {

                statusMatch = rowStatus.includes(selectedStatus);

            }


            /* ==============================
               SHOW / HIDE ROW
            ============================== */

            if (searchMatch && monthMatch && statusMatch) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    /* ==============================
       FILTER EVENTS
    ============================== */

    searchInput.addEventListener("keyup", applyFilters);

    monthFilter.addEventListener("change", applyFilters);

    statusFilter.addEventListener("change", applyFilters);


    /* ==============================
       PART 3 CONTINUES BELOW
    ============================== */
        /* ==============================
       MODAL ELEMENTS
    ============================== */

    const modalTitle = document.getElementById("modalTitle");

    const modalType = document.getElementById("modalType");

    const modalPeriod = document.getElementById("modalPeriod");

    const modalStatus = document.getElementById("modalStatus");

    const modalCompletion = document.getElementById("modalCompletion");

    const rank1Name = document.getElementById("rank1Name");

    const rank1Sales = document.getElementById("rank1Sales");

    const rank2Name = document.getElementById("rank2Name");

    const rank2Sales = document.getElementById("rank2Sales");

    const rank3Name = document.getElementById("rank3Name");

    const rank3Sales = document.getElementById("rank3Sales");


    /* ==============================
       TARGET DATA
    ============================== */

    const targetData = {

        campaign1: {

            title: "July Antibiotic Campaign",

            type: "Doctors",

            period: "01 Jul 2026 - 31 Jul 2026",

            status: "Active",

            completion: "68%",

            performers: [

                { name: "Rahul Patil", sales: "₹2,35,000" },

                { name: "Sneha More", sales: "₹2,05,000" },

                { name: "Amit Deshmukh", sales: "₹1,82,000" }

            ]

        },

        campaign2: {

            title: "Monsoon Sales Drive",

            type: "Pharmacy",

            period: "05 Jul 2026 - 05 Aug 2026",

            status: "Active",

            completion: "42%",

            performers: [

                { name: "ABC Pharma", sales: "₹3,25,000" },

                { name: "City Medical", sales: "₹2,84,000" },

                { name: "Health Plus", sales: "₹2,41,000" }

            ]

        },

        campaign3: {

            title: "Vaccine Promotion",

            type: "MR Team",

            period: "01 Jun 2026 - 30 Jun 2026",

            status: "Closed",

            completion: "100%",

            performers: [

                { name: "Rahul Patil", sales: "₹4,82,000" },

                { name: "Sneha More", sales: "₹4,21,000" },

                { name: "Amit Deshmukh", sales: "₹3,96,000" }

            ]

        },

        campaign4: {

            title: "Pain Relief Campaign",

            type: "Doctors",

            period: "10 Jul 2026 - 31 Jul 2026",

            status: "Active",

            completion: "27%",

            performers: [

                { name: "Dr. Sharma", sales: "₹1,52,000" },

                { name: "Dr. Patil", sales: "₹1,36,000" },

                { name: "Dr. Desai", sales: "₹1,12,000" }

            ]

        }

    };


    /* ==============================
       OPEN MODAL
    ============================== */

    viewButtons.forEach(button => {

        button.addEventListener("click", () => {

            const target = targetData[button.dataset.target];

            modalTitle.textContent = target.title;

            modalType.textContent = target.type;

            modalPeriod.textContent = target.period;

            modalCompletion.textContent = target.completion;

            modalStatus.textContent = target.status;

            modalStatus.className = "status " +
                target.status.toLowerCase();

            rank1Name.textContent = target.performers[0].name;
            rank1Sales.textContent = target.performers[0].sales;

            rank2Name.textContent = target.performers[1].name;
            rank2Sales.textContent = target.performers[1].sales;

            rank3Name.textContent = target.performers[2].name;
            rank3Sales.textContent = target.performers[2].sales;

            modal.style.display = "flex";

        });

    });


    /* ==============================
       PART 4 CONTINUES BELOW
    ============================== */
        /* ==============================
       CLOSE MODAL
    ============================== */

    closeModal.addEventListener("click", () => {

        modal.style.display = "none";

    });


    /* ==============================
       CLOSE ON OUTSIDE CLICK
    ============================== */

    window.addEventListener("click", (event) => {

        if (event.target === modal) {

            modal.style.display = "none";

        }

    });


    /* ==============================
       CLOSE ON ESC KEY
    ============================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            modal.style.display = "none";

        }

    });


    /* ==============================
       INITIALIZE FILTERS
    ============================== */

    applyFilters();

    console.log("Target Tracking Loaded Successfully");

});