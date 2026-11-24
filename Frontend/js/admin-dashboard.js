// ======================================================
// MK ANIMAL HEALTH ERP
// ADMIN DASHBOARD
// ======================================================



// ======================================================
// MONTHLY SALES BAR CHART
// ======================================================

const salesChart = document.getElementById("salesChart");

if (salesChart) {

    new Chart(salesChart, {

        type: "bar",

        data: {

            labels: [

                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"

            ],

            datasets: [{

                label: "Sales",

                data: [

                    420000,
                    520000,
                    480000,
                    610000,
                    700000,
                    640000,
                    760000,
                    850000,
                    820000,
                    910000,
                    980000,
                    1100000

                ],

                backgroundColor:"#2F80ED",

                borderRadius:8,

                borderSkipped:false,

                maxBarThickness:28

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            animation:{

                duration:1800

            },

            plugins:{

                legend:{

                    display:false

                },

                tooltip:{

                    callbacks:{

                        label:function(context){

                            return " ₹"+context.raw.toLocaleString();

                        }

                    }

                }

            },

            scales:{

                x:{

                    grid:{

                        display:false

                    }

                },

                y:{

                    beginAtZero:true,

                    grid:{

                        color:"#EEF3F8"

                    },

                    ticks:{

                        callback:function(value){

                            return "₹"+(value/100000).toFixed(1)+"L";

                        }

                    }

                }

            }

        }

    });

}



// ======================================================
// SALES OVERVIEW
// ======================================================

const overviewChart = document.getElementById("overviewChart");

if (overviewChart) {

    new Chart(overviewChart, {

        type:"doughnut",

        data:{

            labels:[

                "Doctors",

                "Pharmacy",

                "MR",

                "Others"

            ],

            datasets:[{

                data:[

                    45,

                    25,

                    20,

                    10

                ],

                backgroundColor:[

                    "#2F80ED",

                    "#44C776",

                    "#8B5CF6",

                    "#F9A826"

                ],

                borderWidth:0,

                hoverOffset:15

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            cutout:"72%",

            plugins:{

                legend:{

                    position:"bottom",

                    labels:{

                        usePointStyle:true,

                        pointStyle:"circle",

                        padding:18,

                        font:{

                            family:"Poppins",

                            size:13

                        }

                    }

                }

            }

        }

    });

}

// ======================================================
// KPI COUNTER ANIMATION
// ======================================================

const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    const target = Number(counter.getAttribute("data-target"));

    let count = 0;

    const increment = target / 120;

    function updateCounter(){

        if(count < target){

            count += increment;

            if(target > 100000){

                counter.innerText =
                    "₹" + Math.floor(count).toLocaleString();

            }

            else{

                counter.innerText =
                    Math.floor(count).toLocaleString();

            }

            requestAnimationFrame(updateCounter);

        }

        else{

            if(target > 100000){

                counter.innerText =
                    "₹" + target.toLocaleString();

            }

            else{

                counter.innerText =
                    target.toLocaleString();

            }

        }

    }

    updateCounter();

});

// ======================================================
// DASHBOARD LOAD ANIMATION
// ======================================================

window.addEventListener("load",()=>{

    const sections=document.querySelectorAll(

        ".welcome,.card,.chart-box,.recent-orders,.notifications,.low-stock"

    );

    sections.forEach((section,index)=>{

        section.style.opacity="0";

        section.style.transform="translateY(25px)";

        setTimeout(()=>{

            section.style.transition="0.6s ease";

            section.style.opacity="1";

            section.style.transform="translateY(0px)";

        },index*120);

    });

});

// ======================================================
// CARD HOVER EFFECT
// ======================================================

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-10px)";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="translateY(0px)";

    });

});

// ======================================================
// SIDEBAR TOGGLE
// ======================================================

const menuToggle = document.getElementById("menuToggle");

const sidebar = document.querySelector(".sidebar");

const mainContent = document.querySelector(".main-content");

menuToggle.addEventListener("click",()=>{

    sidebar.classList.toggle("collapsed");

    mainContent.classList.toggle("expanded");

});

// ======================================================
// FUTURE BACKEND FUNCTIONS
// ======================================================

// Future:
// fetch('/api/dashboard')
// .then(response => response.json())
// .then(data => {
//      Update charts
//      Update cards
//      Update notifications
// });
// ======================================================
// LOGOUT POPUP
// ======================================================

const logoutBtn = document.getElementById("logoutBtn");

const logoutModal = document.getElementById("logoutModal");

const cancelLogout = document.getElementById("cancelLogout");

const confirmLogout = document.getElementById("confirmLogout");

console.log(logoutBtn);
console.log(logoutModal);
console.log(cancelLogout);
console.log(confirmLogout);

// Open Popup

logoutBtn.addEventListener("click",()=>{

    logoutModal.classList.add("active");

});


// Close Popup

cancelLogout.addEventListener("click",()=>{

    logoutModal.classList.remove("active");

});


// Close When Clicking Outside

logoutModal.addEventListener("click",(event)=>{

    if(event.target===logoutModal){

        logoutModal.classList.remove("active");

    }

});


// Close With ESC Key

document.addEventListener("keydown",(event)=>{

    if(event.key==="Escape"){

        logoutModal.classList.remove("active");

    }

});


// Confirm Logout

confirmLogout.addEventListener("click",()=>{

    // Clear Login Session (optional)

    sessionStorage.clear();

    localStorage.removeItem("loggedInUser");

    // Redirect

    window.location.href="../index.html";

});