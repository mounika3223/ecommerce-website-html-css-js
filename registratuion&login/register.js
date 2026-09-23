document.getElementById("formContainer").addEventListener("submit",(e)=>{
    e.preventDefault();
    let name=document.getElementById("name").value;
    let email=document.getElementById("email").value;
    let mobile=document.getElementById("mobile").value;
    let password=document.getElementById("password").value;
    console.log(name,email,mobile,password);
    let userdata={

        username: name,
        useremail:email,
        userpassword:password,
        usermobile:mobile,

    };
    console.log(userdata);
    localStorage.setItem("userinfo",JSON.stringify(userdata));
    alert("Account created successfully!!!");
    window.location.href="./login.html";


});