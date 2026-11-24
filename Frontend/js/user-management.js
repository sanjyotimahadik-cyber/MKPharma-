/*=========================================================
MK ANIMAL HEALTH ERP
USER MANAGEMENT SYSTEM
PART 1 : FOUNDATION
=========================================================*/

/*=========================================================
DOM ELEMENTS
=========================================================*/

// Category Buttons
const employeeTab = document.getElementById("employeeTab");
const mrTab = document.getElementById("mrTab");
const doctorTab = document.getElementById("doctorTab");
const pharmacyTab = document.getElementById("pharmacyTab");

// Sections
const employeeSection = document.getElementById("employeeSection");
const mrSection = document.getElementById("mrSection");
const doctorSection = document.getElementById("doctorSection");
const pharmacySection = document.getElementById("pharmacySection");

// Toolbar
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const refreshBtn = document.getElementById("refreshBtn");
const exportBtn = document.getElementById("exportBtn");
const addUserBtn = document.getElementById("addUserBtn");
const addButtonText = document.getElementById("addButtonText");

// Statistics
const totalUsersCount = document.getElementById("totalUsersCount");
const totalUsersLabel = document.getElementById("totalUsersLabel");
const activeUsersCount = document.getElementById("activeUsersCount");
const inactiveUsersCount = document.getElementById("inactiveUsersCount");
const performanceCount = document.getElementById("performanceCount");
const performanceLabel = document.getElementById("performanceLabel");

// Analytics
const analyticsTitle = document.getElementById("analyticsTitle");
const analyticsSubtitle = document.getElementById("analyticsSubtitle");
const analyticsPeriod = document.getElementById("analyticsPeriod");

const bestPerformerName = document.getElementById("bestPerformerName");
const bestPerformerScore = document.getElementById("bestPerformerScore");
const averagePerformance = document.getElementById("averagePerformance");
const highestGrowth = document.getElementById("highestGrowth");

// Tables
const employeeTableBody = document.getElementById("employeeTableBody");
const mrTableBody = document.getElementById("mrTableBody");
const doctorTableBody = document.getElementById("doctorTableBody");
const pharmacyTableBody = document.getElementById("pharmacyTableBody");

// Empty States
const employeeEmptyState = document.getElementById("employeeEmptyState");
const mrEmptyState = document.getElementById("mrEmptyState");
const doctorEmptyState = document.getElementById("doctorEmptyState");
const pharmacyEmptyState = document.getElementById("pharmacyEmptyState");

// Popups
const employeePopup = document.getElementById("employeePopup");
const mrPopup = document.getElementById("mrPopup");
const doctorPopup = document.getElementById("doctorPopup");
const pharmacyPopup = document.getElementById("pharmacyPopup");

// Chart
const chartCanvas = document.getElementById("performanceChart");


/*=========================================================
APPLICATION STATE
=========================================================*/

let currentCategory = "employee";

let performanceChart = null;


/*=========================================================
MASTER DATA
=========================================================*/

const database = {

    employee: [],

    mr: [],

    doctor: [],

    pharmacy: []

};


/*=========================================================
CATEGORY CONFIGURATION
=========================================================*/

const categoryConfig = {

    employee:{

        title:"Employee List",

        addText:"Add Employee",

        statisticsLabel:"Total Employees",

        analyticsTitle:"Employee Performance Analytics",

        analyticsSubtitle:
        "Weekly performance analysis of the Top 3 Employees.",

        prefix:"EMP"

    },

    mr:{

        title:"Medical Representatives",

        addText:"Add MR",

        statisticsLabel:"Total Medical Representatives",

        analyticsTitle:"MR Performance Analytics",

        analyticsSubtitle:
        "Performance analysis of the Top 3 Medical Representatives.",

        prefix:"MR"

    },

    doctor:{

        title:"Doctor Management",

        addText:"Add Doctor",

        statisticsLabel:"Total Doctors",

        analyticsTitle:"Doctor Performance Analytics",

        analyticsSubtitle:
        "Monthly performance analysis of the Top 3 Doctors.",

        prefix:"DOC"

    },

    pharmacy:{

        title:"Pharmacy Management",

        addText:"Add Pharmacy",

        statisticsLabel:"Total Pharmacies",

        analyticsTitle:"Pharmacy Performance Analytics",

        analyticsSubtitle:
        "Monthly performance analysis of the Top 3 Pharmacies.",

        prefix:"PH"

    }

};


/*=========================================================
TABLE REFERENCES
=========================================================*/

const tableBodies = {

    employee:employeeTableBody,

    mr:mrTableBody,

    doctor:doctorTableBody,

    pharmacy:pharmacyTableBody

};


const emptyStates = {

    employee:employeeEmptyState,

    mr:mrEmptyState,

    doctor:doctorEmptyState,

    pharmacy:pharmacyEmptyState

};


const sections = {

    employee:employeeSection,

    mr:mrSection,

    doctor:doctorSection,

    pharmacy:pharmacySection

};


const popups = {

    employee:employeePopup,

    mr:mrPopup,

    doctor:doctorPopup,

    pharmacy:pharmacyPopup

};


/*=========================================================
UTILITY FUNCTIONS
=========================================================*/

function getCurrentData(){

    return database[currentCategory];

}


function getConfig(){

    return categoryConfig[currentCategory];

}


function getTableBody(){

    return tableBodies[currentCategory];

}


function getEmptyState(){

    return emptyStates[currentCategory];

}


function getSection(){

    return sections[currentCategory];

}


function getPopup(){

    return popups[currentCategory];

}


/*=========================================================
ID GENERATOR
=========================================================*/

function generateId(category){

    const prefix = categoryConfig[category].prefix;

    const nextNumber = database[category].length + 1;

    return `${prefix}${String(nextNumber).padStart(3,"0")}`;

}


/*=========================================================
HELPERS
=========================================================*/

function calculateAveragePerformance(data){

    if(data.length===0) return 0;

    const total = data.reduce((sum,user)=>{

        return sum + (user.performance || 0);

    },0);

    return Math.round(total/data.length);

}


function activeUsers(data){

    return data.filter(user=>user.status==="Active").length;

}


function inactiveUsers(data){

    return data.filter(user=>user.status==="Inactive").length;

}
/*=========================================================
PART 2 : APPLICATION CONTROLLER
=========================================================*/


/*=========================================================
CATEGORY BUTTON REFERENCES
=========================================================*/

const categoryButtons = {

    employee: employeeTab,

    mr: mrTab,

    doctor: doctorTab,

    pharmacy: pharmacyTab

};


/*=========================================================
SHOW CURRENT SECTION
=========================================================*/

function showCurrentSection(){

    Object.values(sections).forEach(section=>{

        section.classList.add("hidden");

    });

    getSection().classList.remove("hidden");

}


/*=========================================================
UPDATE ACTIVE TAB
=========================================================*/

function updateActiveTab(){

    Object.values(categoryButtons).forEach(button=>{

        button.classList.remove("active");

    });

    categoryButtons[currentCategory].classList.add("active");

}


/*=========================================================
UPDATE PAGE CONTENT
=========================================================*/

function updatePageContent(){

    const config = getConfig();

    addButtonText.textContent = config.addText;

    totalUsersLabel.textContent = config.statisticsLabel;

    analyticsTitle.textContent = config.analyticsTitle;

    analyticsSubtitle.textContent = config.analyticsSubtitle;

}


/*=========================================================
UPDATE STATISTICS
=========================================================*/

function updateStatistics(){

    const data = getCurrentData();

    totalUsersCount.textContent = data.length;

    activeUsersCount.textContent = activeUsers(data);

    inactiveUsersCount.textContent = inactiveUsers(data);

    performanceCount.textContent =
        `${calculateAveragePerformance(data)}%`;

}


/*=========================================================
EMPTY STATE
=========================================================*/

function updateEmptyState(){

    const data = getCurrentData();

    const tableBody = getTableBody();

    const emptyState = getEmptyState();

    if(data.length===0){

        tableBody.parentElement.style.display = "none";

        emptyState.style.display = "flex";

    }

    else{

        tableBody.parentElement.style.display = "block";

        emptyState.style.display = "none";

    }

}


/*=========================================================
CHANGE CATEGORY
=========================================================*/

function changeCategory(category){

    currentCategory = category;

    showCurrentSection();

    updateActiveTab();

    updatePageContent();

    updateStatistics();

    updateEmptyState();

    renderTable();

    updateAnalytics();

}


/*=========================================================
CATEGORY EVENTS
=========================================================*/

employeeTab.addEventListener("click",()=>{

    changeCategory("employee");

});

mrTab.addEventListener("click",()=>{

    changeCategory("mr");

});

doctorTab.addEventListener("click",()=>{

    changeCategory("doctor");

});

pharmacyTab.addEventListener("click",()=>{

    changeCategory("pharmacy");

});


/*=========================================================
INITIAL APPLICATION LOAD
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    showCurrentSection();

    updateActiveTab();

    updatePageContent();

    updateStatistics();

    updateEmptyState();

});
/*=========================================================
PART 3A : TABLE RENDERING
=========================================================*/

/*=========================================================
RENDER TABLE
=========================================================*/

function renderTable(){

    const tableBody = getTableBody();
    const data = getCurrentData();

    tableBody.innerHTML = "";

    if(data.length===0){

        updateEmptyState();
        return;

    }

    let html = "";

    switch(currentCategory){

        case "employee":
            html = data.map((user,index)=>employeeRow(user,index)).join("");
            break;

        case "mr":
            html = data.map((user,index)=>mrRow(user,index)).join("");
            break;

        case "doctor":
            html = data.map((user,index)=>doctorRow(user,index)).join("");
            break;

        case "pharmacy":
            html = data.map((user,index)=>pharmacyRow(user,index)).join("");
            break;

    }

    tableBody.innerHTML = html;

    updateEmptyState();

}


/*=========================================================
COMMON ACTION BUTTONS
=========================================================*/

function actionButtons(index){

    return `

    <div class="actions">

        <button
            class="edit-btn"
            onclick="editUser(${index})">

            <i class="fa-solid fa-pen"></i>

        </button>

        <button
            class="delete-btn"
            onclick="deleteUser(${index})">

            <i class="fa-solid fa-trash"></i>

        </button>

    </div>

    `;

}


/*=========================================================
EMPLOYEE ROW
=========================================================*/

function employeeRow(user,index){

return `

<tr>

<td>${user.id}</td>

<td>${user.name}</td>

<td>${user.department}</td>

<td>${user.designation}</td>

<td>${user.phone}</td>

<td>

<span class="status ${user.status.toLowerCase()}">

${user.status}

</span>

</td>

<td>

<span class="performance">

${user.performance}%

</span>

</td>

<td>${actionButtons(index)}</td>

</tr>

`;

}


/*=========================================================
MR ROW
=========================================================*/

function mrRow(user,index){

return `

<tr>

<td>${user.id}</td>

<td>${user.name}</td>

<td>${user.area}</td>

<td>${user.doctors}</td>

<td>${user.sales}</td>

<td>

<span class="status ${user.status.toLowerCase()}">

${user.status}

</span>

</td>

<td>

<span class="performance">

${user.performance}%

</span>

</td>

<td>${actionButtons(index)}</td>

</tr>

`;

}


/*=========================================================
DOCTOR ROW
=========================================================*/

function doctorRow(user,index){

return `

<tr>

<td>${user.id}</td>

<td>${user.name}</td>

<td>${user.specialization}</td>

<td>${user.hospital}</td>

<td>${user.phone}</td>

<td>${user.mr}</td>

<td>${user.orders}</td>

<td>

<span class="status ${user.status.toLowerCase()}">

${user.status}

</span>

</td>

<td>

<span class="performance">

${user.performance}%

</span>

</td>

<td>${actionButtons(index)}</td>

</tr>

`;

}


/*=========================================================
PHARMACY ROW
=========================================================*/

function pharmacyRow(user,index){

return `

<tr>

<td>${user.id}</td>

<td>${user.name}</td>

<td>${user.owner}</td>

<td>${user.location}</td>

<td>${user.phone}</td>

<td>${user.mr}</td>

<td>${user.orders}</td>

<td>${user.purchase}</td>

<td>

<span class="status ${user.status.toLowerCase()}">

${user.status}

</span>

</td>

<td>

<span class="performance">

${user.performance}%

</span>

</td>

<td>${actionButtons(index)}</td>

</tr>

`;

}
/*=========================================================
PART 3B-1 : POPUP MANAGEMENT
=========================================================*/

/*=========================================================
EDIT STATE
=========================================================*/

let editMode = false;

let editingIndex = -1;


/*=========================================================
FORM REFERENCES
=========================================================*/

const forms = {

    employee: document.getElementById("employeeForm"),

    mr: document.getElementById("mrForm"),

    doctor: document.getElementById("doctorForm"),

    pharmacy: document.getElementById("pharmacyForm")

};


/*=========================================================
FORM RESET
=========================================================*/

function resetForm(){

    forms[currentCategory].reset();

}


/*=========================================================
OPEN POPUP
=========================================================*/

function openPopup(){

    editMode = false;

    editingIndex = -1;

    resetForm();

    switch(currentCategory){

        case "employee":

            document.getElementById("employeeId").value =
                generateId("employee");

            break;

        case "mr":

            document.getElementById("mrId").value =
                generateId("mr");

            break;

        case "doctor":

            document.getElementById("doctorId").value =
                generateId("doctor");

            break;

        case "pharmacy":

            document.getElementById("pharmacyId").value =
                generateId("pharmacy");

            break;

    }

    getPopup().classList.add("active");

}


/*=========================================================
CLOSE POPUP
=========================================================*/

function closePopup(){

    getPopup().classList.remove("active");

}


/*=========================================================
READ FORM DATA
=========================================================*/

function getFormData(){

    switch(currentCategory){

        case "employee":

            return{

                id:employeeId.value,

                name:employeeName.value.trim(),

                department:department.value.trim(),

                designation:designation.value.trim(),

                phone:employeePhone.value.trim(),

                status:employeeStatus.value,

                performance:Math.floor(Math.random()*41)+60

            };



        case "mr":

            return{

                id:mrId.value,

                name:mrName.value.trim(),

                area:assignedArea.value.trim(),

                phone:mrPhone.value.trim(),

                doctors:0,

                sales:0,

                status:mrStatus.value,

                performance:Math.floor(Math.random()*41)+60

            };



        case "doctor":

            return{

                id:doctorId.value,

                name:doctorName.value.trim(),

                specialization:specialization.value.trim(),

                hospital:hospital.value.trim(),

                phone:doctorPhone.value.trim(),

                mr:"--",

                orders:0,

                status:doctorStatus.value,

                performance:Math.floor(Math.random()*41)+60

            };



        case "pharmacy":

            return{

                id:pharmacyId.value,

                name:pharmacyName.value.trim(),

                owner:ownerName.value.trim(),

                location:location.value.trim(),

                phone:pharmacyPhone.value.trim(),

                mr:"--",

                orders:0,

                purchase:0,

                status:pharmacyStatus.value,

                performance:Math.floor(Math.random()*41)+60

            };

    }

}


/*=========================================================
LOAD DATA INTO FORM (EDIT)
=========================================================*/

function loadFormData(user){

    switch(currentCategory){

        case "employee":

            employeeId.value=user.id;

            employeeName.value=user.name;

            department.value=user.department;

            designation.value=user.designation;

            employeePhone.value=user.phone;

            employeeStatus.value=user.status;

            break;



        case "mr":

            mrId.value=user.id;

            mrName.value=user.name;

            assignedArea.value=user.area;

            mrPhone.value=user.phone;

            mrStatus.value=user.status;

            break;



        case "doctor":

            doctorId.value=user.id;

            doctorName.value=user.name;

            specialization.value=user.specialization;

            hospital.value=user.hospital;

            doctorPhone.value=user.phone;

            doctorStatus.value=user.status;

            break;



        case "pharmacy":

            pharmacyId.value=user.id;

            pharmacyName.value=user.name;

            ownerName.value=user.owner;

            location.value=user.location;

            pharmacyPhone.value=user.phone;

            pharmacyStatus.value=user.status;

            break;

    }

}


/*=========================================================
EDIT USER
=========================================================*/

function editUser(index){

    editMode = true;

    editingIndex = index;

    loadFormData(getCurrentData()[index]);

    getPopup().classList.add("active");

}
/*=========================================================
PART 3B-2 : CRUD & EVENTS
=========================================================*/


/*=========================================================
SAVE USER
=========================================================*/

function saveUser(event){

    event.preventDefault();

    const user = getFormData();

    if(editMode){

        user.performance =
            getCurrentData()[editingIndex].performance;

        getCurrentData()[editingIndex] = user;

    }

    else{

        database[currentCategory].push(user);

    }

    closePopup();

    renderTable();

    updateStatistics();

    updateAnalytics();

}


/*=========================================================
DELETE USER
=========================================================*/

function deleteUser(index){

    if(!confirm("Delete this record?")) return;

    database[currentCategory].splice(index,1);

    renderTable();

    updateStatistics();

    updateAnalytics();

}


/*=========================================================
ADD USER BUTTON
=========================================================*/

addUserBtn.addEventListener("click",openPopup);


/*=========================================================
FORM SUBMIT EVENTS
=========================================================*/

forms.employee.addEventListener("submit",saveUser);

forms.mr.addEventListener("submit",saveUser);

forms.doctor.addEventListener("submit",saveUser);

forms.pharmacy.addEventListener("submit",saveUser);


/*=========================================================
CLOSE BUTTON EVENTS
=========================================================*/

document
.getElementById("closeEmployeePopup")
.addEventListener("click",closePopup);

document
.getElementById("closeMRPopup")
.addEventListener("click",closePopup);

document
.getElementById("closeDoctorPopup")
.addEventListener("click",closePopup);

document
.getElementById("closePharmacyPopup")
.addEventListener("click",closePopup);


/*=========================================================
OVERLAY CLOSE
=========================================================*/

Object.values(popups).forEach(popup=>{

    popup.addEventListener("click",event=>{

        if(event.target===popup){

            closePopup();

        }

    });

});


/*=========================================================
ESC KEY CLOSE
=========================================================*/

document.addEventListener("keydown",event=>{

    if(event.key==="Escape"){

        closePopup();

    }

});


/*=========================================================
INITIAL TABLE
=========================================================*/

renderTable();
/*=========================================================
PART 4A : VALIDATION & COMMON HELPERS
=========================================================*/

function validateForm(user){

    for(const key in user){

        if(key==="performance" ||
           key==="sales" ||
           key==="orders" ||
           key==="purchase" ||
           key==="doctors" ||
           key==="mr"){

            continue;

        }

        if(String(user[key]).trim()===""){

            alert("Please fill all required fields.");

            return false;

        }

    }

    const phone = user.phone;

    if(phone && !/^[6-9]\d{9}$/.test(phone)){

        alert("Enter a valid 10-digit mobile number.");

        return false;

    }

    return true;

}


/*=========================================================
OVERRIDE SAVE USER
=========================================================*/

function saveUser(event){

    event.preventDefault();

    const user = getFormData();

    if(!validateForm(user)) return;

    if(editMode){

        user.performance =
            getCurrentData()[editingIndex].performance;

        if(user.sales!==undefined)
            user.sales=getCurrentData()[editingIndex].sales;

        if(user.orders!==undefined)
            user.orders=getCurrentData()[editingIndex].orders;

        if(user.purchase!==undefined)
            user.purchase=getCurrentData()[editingIndex].purchase;

        if(user.doctors!==undefined)
            user.doctors=getCurrentData()[editingIndex].doctors;

        if(user.mr!==undefined)
            user.mr=getCurrentData()[editingIndex].mr;

        getCurrentData()[editingIndex]=user;

    }

    else{

        database[currentCategory].push(user);

    }

    closePopup();

    renderTable();

    updateStatistics();

    updateAnalytics();

}


/*=========================================================
REFRESH PAGE
=========================================================*/

refreshBtn.addEventListener("click",()=>{

    renderTable();

    updateStatistics();

    updateAnalytics();

});


/*=========================================================
ANALYTICS PERIOD
=========================================================*/

analyticsPeriod.addEventListener("change",()=>{

    updateAnalytics();

});
/*=========================================================
PART 4B : SEARCH • FILTER • EXPORT
=========================================================*/


/*=========================================================
GET FILTERED DATA
=========================================================*/

function getFilteredData(){

    const search = searchInput.value.trim().toLowerCase();

    const status = statusFilter.value;

    return getCurrentData()

        .map((user,index)=>({

            user,

            index

        }))

        .filter(item=>{

            const user=item.user;

            const searchMatch=

                search===""

                ||

                Object.values(user).some(value=>

                    String(value)

                    .toLowerCase()

                    .includes(search)

                );

            const statusMatch=

                status==="All"

                ||

                user.status===status;

            return searchMatch && statusMatch;

        });

}


/*=========================================================
RENDER FILTERED TABLE
=========================================================*/

function renderFilteredTable(){

    const tableBody=getTableBody();

    const filtered=getFilteredData();

    tableBody.innerHTML="";

    if(filtered.length===0){

        tableBody.parentElement.style.display="none";

        getEmptyState().style.display="flex";

        return;

    }

    tableBody.parentElement.style.display="block";

    getEmptyState().style.display="none";

    let html="";

    switch(currentCategory){

        case "employee":

            html=filtered.map(item=>

                employeeRow(item.user,item.index)

            ).join("");

            break;

        case "mr":

            html=filtered.map(item=>

                mrRow(item.user,item.index)

            ).join("");

            break;

        case "doctor":

            html=filtered.map(item=>

                doctorRow(item.user,item.index)

            ).join("");

            break;

        case "pharmacy":

            html=filtered.map(item=>

                pharmacyRow(item.user,item.index)

            ).join("");

            break;

    }

    tableBody.innerHTML=html;

}


/*=========================================================
SEARCH
=========================================================*/

searchInput.addEventListener(

    "input",

    renderFilteredTable

);


/*=========================================================
STATUS FILTER
=========================================================*/

statusFilter.addEventListener(

    "change",

    renderFilteredTable

);


/*=========================================================
REFRESH
=========================================================*/

refreshBtn.addEventListener("click",()=>{

    searchInput.value="";

    statusFilter.value="All";

    renderTable();

    updateStatistics();

    updateAnalytics();

});


/*=========================================================
EXPORT CSV
=========================================================*/

function exportCSV(){

    const rows=getFilteredData();

    if(rows.length===0){

        alert("No data available.");

        return;

    }

    const data=rows.map(row=>row.user);

    const headers=Object.keys(data[0]);

    let csv=headers.join(",")+"\n";

    data.forEach(user=>{

        csv+=headers

            .map(key=>user[key])

            .join(",")

            +"\n";

    });

    const blob=new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download=currentCategory+".csv";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

}


/*=========================================================
EXPORT BUTTON
=========================================================*/

exportBtn.addEventListener(

    "click",

    exportCSV

);
/*=========================================================
PART 4C : ANALYTICS & CHART
=========================================================*/


/*=========================================================
UPDATE ANALYTICS
=========================================================*/

function updateAnalytics(){

    const data=[...getCurrentData()];

    if(data.length===0){

        bestPerformerName.textContent="--";

        bestPerformerScore.textContent="Performance : --";

        averagePerformance.textContent="--";

        highestGrowth.textContent="--";

        updateChart([],[]);

        return;

    }

    data.sort((a,b)=>b.performance-a.performance);

    const best=data[0];

    bestPerformerName.textContent=best.name;

    bestPerformerScore.textContent=

        `Performance : ${best.performance}%`;

    averagePerformance.textContent=

        `${calculateAveragePerformance(data)}%`;

    highestGrowth.textContent=

        `${best.performance}%`;

    const top3=data.slice(0,3);

    updateChart(

        top3.map(user=>user.name),

        top3.map(user=>user.performance)

    );

}


/*=========================================================
UPDATE CHART
=========================================================*/

function updateChart(labels,values){

    if(performanceChart){

        performanceChart.destroy();

    }

    performanceChart=new Chart(

        chartCanvas,

        {

            type:"bar",

            data:{

                labels:labels,

                datasets:[{

                    label:"Performance %",

                    data:values,

                    borderWidth:1

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:false,

                scales:{

                    y:{

                        beginAtZero:true,

                        max:100

                    }

                },

                plugins:{

                    legend:{

                        display:false

                    }

                }

            }

        }

    );

}


/*=========================================================
AUTO UPDATE ANALYTICS
=========================================================*/

analyticsPeriod.addEventListener(

    "change",

    updateAnalytics

);
/*=========================================================
PART 4D : SAMPLE DATA & APPLICATION STARTUP
=========================================================*/


/*=========================================================
SAMPLE DATA
=========================================================*/

database.employee = [

{
id:"EMP001",
name:"Rahul Sharma",
department:"Sales",
designation:"Manager",
phone:"9876543210",
status:"Active",
performance:92
},

{
id:"EMP002",
name:"Priya Patel",
department:"Accounts",
designation:"Executive",
phone:"9123456789",
status:"Active",
performance:88
},

{
id:"EMP003",
name:"Amit Verma",
department:"HR",
designation:"Officer",
phone:"9988776655",
status:"Inactive",
performance:75
}

];


database.mr = [

{
id:"MR001",
name:"Rohit Mehta",
area:"Jalgaon",
phone:"9876512345",
doctors:15,
sales:180000,
status:"Active",
performance:94
},

{
id:"MR002",
name:"Kunal Patil",
area:"Nashik",
phone:"9876522222",
doctors:12,
sales:155000,
status:"Active",
performance:89
},

{
id:"MR003",
name:"Ajay More",
area:"Pune",
phone:"9876533333",
doctors:8,
sales:110000,
status:"Inactive",
performance:73
}

];


database.doctor = [

{
id:"DOC001",
name:"Dr. Joshi",
specialization:"Veterinary",
hospital:"City Vet Hospital",
phone:"9876541111",
mr:"Rohit Mehta",
orders:28,
status:"Active",
performance:95
},

{
id:"DOC002",
name:"Dr. Deshmukh",
specialization:"Veterinary",
hospital:"Animal Care Clinic",
phone:"9876542222",
mr:"Kunal Patil",
orders:19,
status:"Active",
performance:87
},

{
id:"DOC003",
name:"Dr. Kulkarni",
specialization:"Veterinary",
hospital:"Pet Health Centre",
phone:"9876543333",
mr:"Ajay More",
orders:11,
status:"Inactive",
performance:72
}

];


database.pharmacy = [

{
id:"PH001",
name:"ABC Medical",
owner:"Suresh Patil",
location:"Jalgaon",
phone:"9876500001",
mr:"Rohit Mehta",
orders:38,
purchase:425000,
status:"Active",
performance:96
},

{
id:"PH002",
name:"Life Care Pharma",
owner:"Rakesh Shah",
location:"Nashik",
phone:"9876500002",
mr:"Kunal Patil",
orders:29,
purchase:318000,
status:"Active",
performance:90
},

{
id:"PH003",
name:"Health Plus",
owner:"Mahesh Jain",
location:"Pune",
phone:"9876500003",
mr:"Ajay More",
orders:17,
purchase:205000,
status:"Inactive",
performance:74
}

];


/*=========================================================
INITIALIZE APPLICATION
=========================================================*/

function initializeApplication(){

    showCurrentSection();

    updateActiveTab();

    updatePageContent();

    renderTable();

    updateStatistics();

    updateAnalytics();

}


/*=========================================================
APPLICATION START
=========================================================*/

document.addEventListener("DOMContentLoaded",()=>{

    initializeApplication();

});