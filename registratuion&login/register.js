/**
 * Qmart - Registration Script (register.js)
 */

document.addEventListener("DOMContentLoaded", () => {
    // Password toggle
    const toggle = document.getElementById("togglePwd");
    const pwdInput = document.getElementById("password");
    if (toggle && pwdInput) {
        toggle.addEventListener("click", () => {
            const isText = pwdInput.type === "text";
            pwdInput.type = isText ? "password" : "text";
            toggle.className = isText ? "fa-regular fa-eye toggle-pwd" : "fa-regular fa-eye-slash toggle-pwd";
        });
    }

    // Form submit
    const form = document.getElementById("formContainer");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const mobile = document.getElementById("mobile").value.trim();
            const password = document.getElementById("password").value;

            const userdata = {
                username: name,
                useremail: email,
                userpassword: password,
                usermobile: mobile,
                registeredAt: new Date().toISOString()
            };

            // Save user credentials
            localStorage.setItem("userinfo", JSON.stringify(userdata));

            // Log user in automatically
            localStorage.setItem("qmart_user", JSON.stringify({
                name: name,
                email: email
            }));

            showToast("Account Created!", `Welcome, ${name}! Your account has been registered.`);

            setTimeout(() => {
                window.location.href = "../home/home.html";
            }, 1200);
        });
    }
});