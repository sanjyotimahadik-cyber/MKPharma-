/* ==========================================
   ATTENDANCE MANAGEMENT
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==============================
       ELEMENTS
    ============================== */

    const searchInput = document.getElementById("employeeSearch");

    const dateFilter = document.getElementById("attendanceDate");

    const statusFilter = document.getElementById("attendanceStatus");

    const table = document.querySelector(".attendance-table");

    const rows = table.querySelectorAll("tbody tr");


    /* ==============================
       SEARCH EMPLOYEE
    ============================== */

    function searchEmployee() {

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        rows.forEach(row => {

            const rowText = row.textContent.toLowerCase();

            if (rowText.includes(keyword)) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }

    searchInput.addEventListener("keyup", searchEmployee);


    /* ==============================
       PART 2 CONTINUES BELOW
    ============================== */
    /* ==============================
       FILTER ATTENDANCE
    ============================== */

    function filterAttendance() {

        const selectedDate = dateFilter.value;

        const selectedStatus = statusFilter.value.toLowerCase();

        rows.forEach(row => {

            const rowDate = row.cells[3].textContent.trim();

            const rowStatus = row.cells[4]
                .textContent
                .trim()
                .toLowerCase();

            let dateMatch = true;

            let statusMatch = true;


            /* Date Filter */

            if (selectedDate !== "") {

                const formattedDate = new Date(selectedDate)
                    .toLocaleDateString("en-GB", {

                        day: "2-digit",

                        month: "short",

                        year: "numeric"

                    })
                    .replace(",", "");

                dateMatch = (rowDate === formattedDate);

            }


            /* Status Filter */

            if (selectedStatus !== "all") {

                statusMatch = rowStatus.includes(selectedStatus);

            }


            /* Show / Hide Row */

            if (dateMatch && statusMatch) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    /* ==============================
       FILTER EVENTS
    ============================== */

    dateFilter.addEventListener("change", filterAttendance);

    statusFilter.addEventListener("change", filterAttendance);


    /* ==============================
       PART 3 CONTINUES BELOW
    ============================== */
        /* ==============================
       COMBINED SEARCH + FILTER
    ============================== */

    function applyFilters() {

        const keyword = searchInput.value
            .toLowerCase()
            .trim();

        const selectedDate = dateFilter.value;

        const selectedStatus = statusFilter.value
            .toLowerCase();

        rows.forEach(row => {

            const rowText = row.textContent
                .toLowerCase();

            const rowDate = row.cells[3]
                .textContent
                .trim();

            const rowStatus = row.cells[4]
                .textContent
                .trim()
                .toLowerCase();

            let searchMatch = rowText.includes(keyword);

            let dateMatch = true;

            let statusMatch = true;


            /* Date Filter */

            if (selectedDate !== "") {

                const formattedDate = new Date(selectedDate)
                    .toLocaleDateString("en-GB", {

                        day: "2-digit",

                        month: "short",

                        year: "numeric"

                    })
                    .replace(",", "");

                dateMatch = (rowDate === formattedDate);

            }


            /* Status Filter */

            if (selectedStatus !== "all") {

                statusMatch = rowStatus.includes(selectedStatus);

            }


            /* Final Result */

            if (searchMatch && dateMatch && statusMatch) {

                row.style.display = "";

            } else {

                row.style.display = "none";

            }

        });

    }


    /* ==============================
       COMBINED EVENTS
    ============================== */

    searchInput.addEventListener("keyup", applyFilters);

    dateFilter.addEventListener("change", applyFilters);

    statusFilter.addEventListener("change", applyFilters);


    /* ==============================
       PART 4 CONTINUES BELOW
    ============================== */
        /* ==============================
       INITIALIZE FILTERS
    ============================== */

    applyFilters();

    console.log("Attendance Management Loaded Successfully");

});