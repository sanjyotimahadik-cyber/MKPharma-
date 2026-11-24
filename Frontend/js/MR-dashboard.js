document.addEventListener("DOMContentLoaded", () => {

    /* ===========================
       ELEMENT REFERENCES
    =========================== */

    const doctorSearch = document.getElementById("doctorSearch");

    const doctorRows = document.querySelectorAll(
        ".doctor-table tbody tr"
    );

    const visitButtons = document.querySelectorAll(".visit-btn");

    const viewButtons = document.querySelectorAll(".view-btn");

    const visitModal = document.getElementById("visitModal");

    const closeModal = document.getElementById("closeModal");

    const doctorName = document.getElementById("doctorName");

    const visitDate = document.getElementById("visitDate");

    const visitTime = document.getElementById("visitTime");

    const discussionNotes = document.getElementById("discussionNotes");

    const productsDiscussed = document.getElementById("productsDiscussed");

    const sampleGiven = document.getElementById("sampleGiven");

    const orderReceived = document.getElementById("orderReceived");

    const saveVisit = document.getElementById("saveVisit");


    /* ===========================
       SEARCH DOCTOR
    =========================== */

    function searchDoctor() {

        const keyword = doctorSearch.value
            .toLowerCase()
            .trim();

        doctorRows.forEach(row => {

            const rowText = row.textContent
                .toLowerCase();

            row.style.display =
                rowText.includes(keyword)
                ? ""
                : "none";

        });

    }

    doctorSearch.addEventListener(
        "keyup",
        searchDoctor
    );


    /* ===========================
       PART 2 CONTINUES BELOW
    =========================== */
        /* ===========================
       OPEN VISIT MODAL
    =========================== */

    visitButtons.forEach(button => {

        button.addEventListener("click", () => {

            const row = button.closest("tr");

            doctorName.textContent =
                row.cells[0].textContent;

            const now = new Date();

            visitDate.textContent =
                now.toLocaleDateString();

            visitTime.textContent =
                now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                });

            discussionNotes.value = "";

            productsDiscussed.value = "";

            sampleGiven.value = "Yes";

            orderReceived.value = "No";

            visitModal.style.display = "flex";

        });

    });


    /* ===========================
       VIEW VISIT DETAILS
    =========================== */

    viewButtons.forEach(button => {

        button.addEventListener("click", () => {

            const row = button.closest("tr");

            doctorName.textContent =
                row.cells[0].textContent;

            visitDate.textContent =
                "12/07/2026";

            visitTime.textContent =
                "10:30 AM";

            discussionNotes.value =
                "Routine follow-up visit completed.";

            productsDiscussed.value =
                "Antibiotic Injection, Calcium Tonic";

            sampleGiven.value = "Yes";

            orderReceived.value = "Yes";

            visitModal.style.display = "flex";

        });

    });


    /* ===========================
       PART 3 CONTINUES BELOW
    =========================== */
        /* ===========================
       SAVE VISIT
    =========================== */

    saveVisit.addEventListener("click", () => {

        const name = doctorName.textContent;

        doctorRows.forEach(row => {

            if (row.cells[0].textContent === name) {

                /* Update Status */

                row.cells[3].innerHTML =
                    '<span class="status visited">Visited</span>';

                /* Change Button */

                row.cells[4].innerHTML =
                    '<button class="view-btn">View</button>';

                /* Attach View Event */

                const newViewButton =
                    row.querySelector(".view-btn");

                newViewButton.addEventListener("click", () => {

                    doctorName.textContent = name;

                    discussionNotes.value =
                        discussionNotes.value;

                    productsDiscussed.value =
                        productsDiscussed.value;

                    sampleGiven.value =
                        sampleGiven.value;

                    orderReceived.value =
                        orderReceived.value;

                    visitModal.style.display = "flex";

                });

            }

        });

        alert("Visit details saved successfully.");

        visitModal.style.display = "none";

    });


    /* ===========================
       PART 4 CONTINUES BELOW
    =========================== */
        /* ===========================
       CLOSE MODAL
    =========================== */

    closeModal.addEventListener("click", () => {

        visitModal.style.display = "none";

    });


    /* ===========================
       CLOSE ON OUTSIDE CLICK
    =========================== */

    window.addEventListener("click", (event) => {

        if (event.target === visitModal) {

            visitModal.style.display = "none";

        }

    });


    /* ===========================
       CLOSE ON ESC KEY
    =========================== */

    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {

            visitModal.style.display = "none";

        }

    });


    /* ===========================
       INITIALIZE
    =========================== */

    searchDoctor();

    console.log("MR Dashboard Loaded Successfully");

});