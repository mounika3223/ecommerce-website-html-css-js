document.addEventListener("DOMContentLoaded", () => {
    displayCart();
});


function displayCart() {

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    let cartContent = document.getElementById("cartContent");

    let totalPrice = document.getElementById("totalPrice");

    let totalbill = 0;


    console.log(cart, cartContent, totalPrice);


    cartContent.innerHTML = "";


    if (cart.length == 0) {

        cartContent.innerHTML = `
            <p>Your cart is Empty. Start Shopping..</p>
        `;

    }

    else {

        cart.map((val, index) => {

            totalbill += val.price * 90;


            let newElement = document.createElement("div");


            newElement.setAttribute("class", "prod-info");


            newElement.innerHTML = `

                <div class="product-card">

                    <img 
                        src="${val.thumbnail}" 
                        class="product-image"
                    >

                    <div class="product-details">

                        <h2>
                            ${val.title}
                        </h2>

                        <p>
                            <b>Category:</b>
                            ${val.category}
                        </p>

                        <p>
                            <b>Description:</b>
                            ${val.description}
                        </p>

                        <p>
                            <b>Brand:</b>
                            ${val.brand || "Not Available"}
                        </p>

                        <p class="rating">
                            ⭐ ${val.rating}
                        </p>

                        <p class="price">
                            $${val.price}
                        </p>

                    </div>

                    <button 
                        class="buy-btn"
                        onclick="buyProduct(${val.id})"
                    >
                        Buy Now
                    </button>

                </div>

                <p>
                    Price: ₹${(val.price * 90).toFixed(2)}
                </p>
                <button onclick="removeFromCart(${index})">Remove</button>
                
            `;


            cartContent.append(newElement);

        });


        totalPrice.innerHTML = `
            <h2>
                Your total bill is ₹${totalbill.toFixed(2)}
            </h2>
        `;

    }
}
function removeFromCart(index){
    // console.log(index);
    let cart=JSON.parse(localStorage.getItem("cart"));
    cart.splice(index,1);
    localStorage.setItem("cart",JSON.stringify(cart));
    window.location.reload();
}