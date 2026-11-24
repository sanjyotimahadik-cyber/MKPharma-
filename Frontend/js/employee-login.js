// ===========================================
// MK Animal Health ERP
// Administrator Login
// ===========================================


// ===============================
// Password Show / Hide
// ===============================

const passwordInput = document.getElementById("adminPassword");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", function () {

    if (passwordInput.type === "password") {

        passwordInput.type = "text";

        togglePassword.classList.remove("fa-eye");
        togglePassword.classList.add("fa-eye-slash");

    }

    else {

        passwordInput.type = "password";

        togglePassword.classList.remove("fa-eye-slash");
        togglePassword.classList.add("fa-eye");

    }

});


// ===============================
// Login Authentication
// ===============================

const loginButton = document.getElementById("loginBtn");

loginButton.addEventListener("click", function () {

    const userId = document.getElementById("adminId").value.trim();

    const password = document.getElementById("adminPassword").value.trim();

    // Demo Credentials
    const validUser = "emp100";
    const validPassword = "12345";

    if (userId === validUser && password === validPassword) {

        alert("Login Successful");

        // Open Admin Dashboard
        window.location.href = "employee-dashboard.html";

    }

    else {

        alert("Invalid User ID or Password");

    }

});