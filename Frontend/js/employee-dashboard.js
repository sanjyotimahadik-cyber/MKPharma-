/*==================================================
  Employee Dashboard JS - Part 1
  Initialization & Live Date Time
==================================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeDashboard();

});


/*==========================================
    Dashboard Initialization
==========================================*/

function initializeDashboard(){

    updateCurrentDate();

    updateCurrentTime();

    setInterval(updateCurrentTime,1000);

}


/*==========================================
    Current Date
==========================================*/

function updateCurrentDate(){

    const dateElement = document.getElementById("currentDate");

    if(!dateElement) return;

    const today = new Date();

    const options = {

        weekday:"long",

        day:"numeric",

        month:"long",

        year:"numeric"

    };

    dateElement.textContent = today.toLocaleDateString("en-IN",options);

}


/*==========================================
    Current Time
==========================================*/

function updateCurrentTime(){

    const timeElement = document.getElementById("currentTime");

    if(!timeElement) return;

    const now = new Date();

    const options = {

        hour:"2-digit",

        minute:"2-digit",

        second:"2-digit",

        hour12:true

    };

    timeElement.textContent = now.toLocaleTimeString("en-IN",options);

}
/*==================================================
  Employee Dashboard JS - Part 2
  Profile Dropdown
==================================================*/


/*==========================================
    Initialize Profile Menu
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeProfileDropdown();

});


function initializeProfileDropdown(){

    const profileBtn = document.getElementById("profileBtn");

    const profileDropdown = document.getElementById("profileDropdown");

    if(!profileBtn || !profileDropdown) return;


    /*==============================
        Toggle Dropdown
    ==============================*/

    profileBtn.addEventListener("click",(event)=>{

        event.stopPropagation();

        profileDropdown.classList.toggle("show");

    });


    /*==============================
        Prevent Closing
    ==============================*/

    profileDropdown.addEventListener("click",(event)=>{

        event.stopPropagation();

    });


    /*==============================
        Close on Outside Click
    ==============================*/

    document.addEventListener("click",()=>{

        profileDropdown.classList.remove("show");

    });

}
/*==================================================
  Employee Dashboard JS - Part 3
  Notification System
==================================================*/


/*==========================================
    Sample Notifications
==========================================*/

let notifications = [

    {
        id:1,
        title:"Attendance Marked",
        message:"Your attendance has been marked successfully.",
        time:"2 min ago",
        read:false
    },

    {
        id:2,
        title:"Leave Approved",
        message:"Your leave request has been approved.",
        time:"1 hour ago",
        read:false
    },

    {
        id:3,
        title:"Company Notice",
        message:"Monthly staff meeting at 3:00 PM.",
        time:"Yesterday",
        read:true
    }

];


/*==========================================
    Initialize Notifications
==========================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initializeNotifications();

});


function initializeNotifications(){

    const notificationBtn =
        document.getElementById("notificationBtn");

    const notificationDropdown =
        document.getElementById("notificationDropdown");

    if(!notificationBtn || !notificationDropdown)
        return;


    renderNotifications();


    notificationBtn.addEventListener("click",(event)=>{

        event.stopPropagation();

        notificationDropdown.classList.toggle("show");

    });


    notificationDropdown.addEventListener("click",(event)=>{

        event.stopPropagation();

    });


    document.addEventListener("click",()=>{

        notificationDropdown.classList.remove("show");

    });

}
/*==========================================
    Render Notifications
==========================================*/

function renderNotifications(){

    const notificationList =
        document.getElementById("notificationList");

    const notificationCount =
        document.getElementById("notificationCount");

    if(!notificationList || !notificationCount)
        return;

    notificationList.innerHTML = "";

    const unreadCount =
        notifications.filter(item=>!item.read).length;

    notificationCount.textContent = unreadCount;


    notifications.forEach(notification=>{

        const item = document.createElement("div");

        item.className =
            notification.read ?
            "notification-item"
            :
            "notification-item unread";


        item.innerHTML = `

            <div class="notification-content">

                <h4>${notification.title}</h4>

                <p>${notification.message}</p>

                <span>${notification.time}</span>

            </div>

        `;


        item.addEventListener("click",()=>{

            notification.read = true;

            renderNotifications();

        });


        notificationList.appendChild(item);

    });

}
/*==================================================
  Employee Dashboard JS - Part 4
  Today's Attendance
==================================================*/

let attendanceData = null;
let workingTimer = null;


/*==========================================
    Initialize Attendance
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeAttendance();

});


function initializeAttendance(){

    loadTodayAttendance();

    setupAttendanceButton();

}


/*==========================================
    Load Today's Attendance
==========================================*/

function loadTodayAttendance(){

    const today = getTodayKey();

    const savedAttendance =
        localStorage.getItem(today);

    if(savedAttendance){

        attendanceData =
            JSON.parse(savedAttendance);

        updateAttendanceUI();

        if(attendanceData.status === "Active"){

            startWorkingTimer();

        }

    }

}


/*==========================================
    Attendance Button
==========================================*/

function setupAttendanceButton(){

    const attendanceBtn =
        document.getElementById("attendanceBtn");

    if(!attendanceBtn) return;

    attendanceBtn.addEventListener("click",handleAttendance);

}


/*==========================================
    Handle Attendance
==========================================*/

function handleAttendance(){

    if(!attendanceData){

        markAttendance();

        return;

    }

    if(attendanceData.status === "Active"){

        markExit();

    }

}


/*==========================================
    Mark Attendance
==========================================*/

function markAttendance(){

    const now = new Date();

    attendanceData = {

        date:getTodayKey(),

        entryTime:now.toISOString(),

        exitTime:null,

        status:"Active"

    };

    saveAttendance();

    updateAttendanceUI();

    startWorkingTimer();

}


/*==========================================
    Mark Exit
==========================================*/

function markExit(){

    attendanceData.exitTime =
        new Date().toISOString();

    attendanceData.status =
        "Completed";

    saveAttendance();

    stopWorkingTimer();

    updateAttendanceUI();

}


/*==========================================
    Save Attendance
==========================================*/

function saveAttendance(){

    localStorage.setItem(

        attendanceData.date,

        JSON.stringify(attendanceData)

    );

}


/*==========================================
    Update UI
==========================================*/

function updateAttendanceUI(){

    document.getElementById("attendanceStatus")
        .textContent = attendanceData.status;

    document.getElementById("entryTime")
        .textContent = formatTime(attendanceData.entryTime);

    document.getElementById("exitTime")
        .textContent = attendanceData.exitTime
            ? formatTime(attendanceData.exitTime)
            : "--";

    const attendanceBtn =
        document.getElementById("attendanceBtn");

    if(attendanceData.status === "Active"){

        attendanceBtn.textContent =
            "Mark Exit";

    }

    else{

        attendanceBtn.textContent =
            "Attendance Completed";

        attendanceBtn.disabled = true;

    }

}


/*==========================================
    Working Hours Timer
==========================================*/

function startWorkingTimer(){

    updateWorkingHours();

    workingTimer = setInterval(

        updateWorkingHours,

        1000

    );

}


function stopWorkingTimer(){

    clearInterval(workingTimer);

    updateWorkingHours();

}


function updateWorkingHours(){

    if(!attendanceData) return;

    const start =
        new Date(attendanceData.entryTime);

    const end =
        attendanceData.exitTime
        ? new Date(attendanceData.exitTime)
        : new Date();

    const diff =
        end - start;

    const hours =
        Math.floor(diff / 3600000);

    const minutes =
        Math.floor((diff % 3600000)/60000);

    const seconds =
        Math.floor((diff % 60000)/1000);

    document.getElementById("workingHours")
        .textContent =

        `${hours}h ${minutes}m ${seconds}s`;

}


/*==========================================
    Utility Functions
==========================================*/

function formatTime(time){

    return new Date(time).toLocaleTimeString(

        "en-IN",

        {

            hour:"2-digit",

            minute:"2-digit",

            second:"2-digit",

            hour12:true

        }

    );

}


function getTodayKey(){

    return new Date()

        .toISOString()

        .split("T")[0];

}
/*==================================================
  Employee Dashboard JS - Part 5
  Monthly Attendance Table
==================================================*/

let monthlyAttendance = [];


/*==========================================
    Initialize Attendance Table
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeAttendanceTable();

});


function initializeAttendanceTable(){

    loadAttendanceHistory();

    setupAttendanceFilters();

    renderAttendanceTable(monthlyAttendance);

}


/*==========================================
    Load Attendance History
==========================================*/

function loadAttendanceHistory(){

    monthlyAttendance = [];

    for(let i = 0; i < localStorage.length; i++){

        const key = localStorage.key(i);

        if(/^\d{4}-\d{2}-\d{2}$/.test(key)){

            const record = JSON.parse(localStorage.getItem(key));

            monthlyAttendance.push(record);

        }

    }

    monthlyAttendance.sort((a,b)=>{

        return new Date(b.date) - new Date(a.date);

    });

}


/*==========================================
    Setup Filters
==========================================*/

function setupAttendanceFilters(){

    const search =
        document.getElementById("attendanceSearch");

    const month =
        document.getElementById("monthFilter");

    const year =
        document.getElementById("yearFilter");

    const refresh =
        document.getElementById("refreshAttendance");

    const exportBtn =
        document.getElementById("exportAttendance");


    if(search){

        search.addEventListener("input",filterAttendance);

    }

    if(month){

        month.addEventListener("change",filterAttendance);

    }

    if(year){

        year.addEventListener("change",filterAttendance);

    }

    if(refresh){

        refresh.addEventListener("click",refreshAttendance);

    }

    if(exportBtn){

        exportBtn.addEventListener("click",exportAttendance);

    }

}


/*==========================================
    Filter Attendance
==========================================*/

function filterAttendance(){

    const searchText =
        document.getElementById("attendanceSearch")
        ?.value
        .toLowerCase() || "";

    const monthValue =
        document.getElementById("monthFilter")
        ?.value || "";

    const yearValue =
        document.getElementById("yearFilter")
        ?.value || "";

    const filtered = monthlyAttendance.filter(record=>{

        const recordDate =
            new Date(record.date);

        const month =
            String(recordDate.getMonth()+1)
            .padStart(2,"0");

        const year =
            String(recordDate.getFullYear());

        const matchesSearch =

            record.date.toLowerCase().includes(searchText)

            ||

            record.status.toLowerCase().includes(searchText);

        const matchesMonth =

            !monthValue ||

            month === monthValue;

        const matchesYear =

            !yearValue ||

            year === yearValue;

        return (

            matchesSearch &&

            matchesMonth &&

            matchesYear

        );

    });

    renderAttendanceTable(filtered);

}


/*==========================================
    Refresh Attendance
==========================================*/

function refreshAttendance(){

    loadAttendanceHistory();

    renderAttendanceTable(monthlyAttendance);

}


/*==========================================
    Render Attendance Table
==========================================*/

function renderAttendanceTable(data){

    const tbody =
        document.getElementById("attendanceTableBody");

    if(!tbody) return;

    tbody.innerHTML = "";

    data.forEach(record=>{

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>${record.date}</td>

            <td>${getDayName(record.date)}</td>

            <td>${formatTime(record.entryTime)}</td>

            <td>${
                record.exitTime
                ?
                formatTime(record.exitTime)
                :
                "--"
            }</td>

            <td>${calculateWorkingHours(record)}</td>

            <td>${record.status}</td>

        `;

        tbody.appendChild(row);

    });

}


/*==========================================
    Export Attendance
==========================================*/

function exportAttendance(){

    console.log(

        "Attendance export will be connected to backend."

    );

}


/*==========================================
    Calculate Working Hours
==========================================*/

function calculateWorkingHours(record){

    if(!record.exitTime){

        return "--";

    }

    const start =
        new Date(record.entryTime);

    const end =
        new Date(record.exitTime);

    const diff =
        end - start;

    const hours =
        Math.floor(diff/3600000);

    const minutes =
        Math.floor((diff%3600000)/60000);

    return `${hours}h ${minutes}m`;

}


/*==========================================
    Get Day Name
==========================================*/

function getDayName(date){

    return new Date(date)

        .toLocaleDateString(

            "en-IN",

            {

                weekday:"long"

            }

        );

}

/*==================================================
  Employee Dashboard JS - Part 7
  Attendance Details Modal
==================================================*/


/*==========================================
    Initialize Attendance Details Modal
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeAttendanceDetailsModal();

});


function initializeAttendanceDetailsModal(){

    const attendanceModal =
        document.getElementById("attendanceModal");

    const closeAttendanceModalBtn =
        document.getElementById("closeAttendanceModal");

    if(closeAttendanceModalBtn){

        closeAttendanceModalBtn.addEventListener("click", () => {

            closeAttendanceModal();

        });

    }

    if(attendanceModal){

        attendanceModal.addEventListener("click", (event) => {

            if(event.target === attendanceModal){

                closeAttendanceModal();

            }

        });

    }

}


/*==========================================
    Open Attendance Details
==========================================*/

function openAttendanceDetails(record){

    if(!record) return;

    document.getElementById("detailDate").textContent =
        record.date;

    document.getElementById("detailStatus").textContent =
        record.status;

    document.getElementById("detailEntry").textContent =
        formatTime(record.entryTime);

    document.getElementById("detailExit").textContent =
        record.exitTime
            ? formatTime(record.exitTime)
            : "--";

    document.getElementById("detailHours").textContent =
        calculateWorkingHours(record);

    document.getElementById("attendanceModal")
        .classList.add("show");

}


/*==========================================
    Close Attendance Details
==========================================*/

function closeAttendanceModal(){

    document.getElementById("attendanceModal")
        .classList.remove("show");

}
/*==================================================
  Employee Dashboard JS - Part 8
  Dashboard Initialization
==================================================*/


/*==========================================
    Employee Information
==========================================*/

let employee = {

    id: "EMP001",

    name: "Rahul Patil",

    department: "Sales",

    designation: "Medical Representative",

    branch: "Jalgaon",

    status: "Active"

};


/*==========================================
    Dashboard Controller
==========================================*/

document.addEventListener("DOMContentLoaded", () => {

    initializeEmployeeDashboard();

});


function initializeEmployeeDashboard(){

    loadEmployeeInformation();

    loadAttendanceSummary();

    loadTodayAttendance();

    loadAttendanceHistory();

    renderAttendanceTable(monthlyAttendance);

}


/*==========================================
    Load Employee Information
==========================================*/

function loadEmployeeInformation(){

    setText("empId", employee.id);

    setText("empName", employee.name);

    setText("department", employee.department);

    setText("designation", employee.designation);

    setText("branch", employee.branch);

    setText("employeeStatus", employee.status);

}


/*==========================================
    Attendance Summary
==========================================*/

function loadAttendanceSummary(){

    let present = 0;

    let absent = 0;

    let leave = 0;

    monthlyAttendance.forEach(record=>{

        switch(record.status){

            case "Completed":

            case "Present":

                present++;

                break;

            case "Absent":

                absent++;

                break;

            case "Leave":

                leave++;

                break;

        }

    });

    const total =
        present + absent + leave;

    const percentage =
        total === 0
        ? 0
        : ((present/total)*100).toFixed(1);

    setText("presentDays",present);

    setText("absentDays",absent);

    setText("leaveDays",leave);

    setText(
        "attendancePercentage",
        percentage + "%"
    );

}


/*==========================================
    Helper Function
==========================================*/

function setText(id,value){

    const element =
        document.getElementById(id);

    if(element){

        element.textContent = value;

    }

}