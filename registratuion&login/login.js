/**
 * Qmart - Login Script (login.js)
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

    // Form submission
    const form = document.getElementById("formContainer");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            let userData = null;
            try {
                userData = JSON.parse(localStorage.getItem("userinfo"));
            } catch (err) {
                userData = null;
            }

            // If user has registered before, check credentials
            if (userData && userData.useremail) {
                if (userData.useremail.toLowerCase() === email.toLowerCase() && userData.userpassword === password) {
                    performLogin(userData.username || "Mounika Reddy", email);
                    return;
                } else {
                    showToast("Login Failed", "Incorrect email or password. Please try again.");
                    return;
                }
            }

            // Demo / Direct login fallback
            const displayName = email.split("@")[0].replace(/[._]/g, " ");
            performLogin(displayName, email);
        });
    }
});

function performLogin(name, email) {
    const user = {
        name: name,
        email: email,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem("qmart_user", JSON.stringify(user));
    showToast("Welcome Back!", `Signed in as ${name}. Redirecting...`);

    setTimeout(() => {
        window.location.href = "../home/home.html";
    }, 1000);
}