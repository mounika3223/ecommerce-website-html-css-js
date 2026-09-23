document.addEventListener("DOMContentLoaded", () => {

    let allproducts = JSON.parse(
        localStorage.getItem("allproducts")
    );

    let pid = localStorage.getItem("pid");

    let productDetails = document.getElementById("productDetails");

    let reviews = document.getElementById("reviews");

    console.log(allproducts, pid, productDetails);


    if (allproducts && pid) {

        // Find selected product
        let selectedProduct = allproducts.find((val) => {
            return val.id == pid;
        });

        console.log(selectedProduct);


        if (selectedProduct) {

            // Display product details
            productDetails.innerHTML = `
                <main>

                    <div class="prod_container">

                        <img 
                            id="image"
                            src="${selectedProduct.images[0]}"
                            width="350px"
                        >

                        <div class="prod_info">

                            <h1 id="title">
                                ${selectedProduct.title}
                            </h1>

                            <p id="brand">
                                <b>Brand:</b> 
                                ${selectedProduct.brand}
                            </p>

                            <p id="description">
                                <b>Description:</b> 
                                ${selectedProduct.description}
                            </p>

                            <p id="price">
                                <b>Price:</b>
                                <span class="price">
                                    $ ${selectedProduct.price}
                                </span>
                            </p>

                            <button id="cart">
                                Add to Cart
                            </button>

                            <button id="back">
                                Back to Home
                            </button>

                        </div>

                    </div>

                    <h1 style="margin-left:30px;">
                        Customer Reviews:
                    </h1>

                </main>
            `;


            // Display reviews
            selectedProduct.reviews.map((v) => {

                reviews.innerHTML += `
                    <hr>

                    <p id="rating">
                        ${"❤️".repeat(v.rating)}
                        ${"🖤".repeat(5 - v.rating)}
                    </p>

                    <p id="comment">
                        ${v.comment}
                    </p>

                    <p id="review_details">
                        By <b>${v.reviewerName}</b>
                        on ${new Date(v.date).toLocaleDateString()}
                    </p>
                `;

            });


            // BACK TO HOME FUNCTIONALITY
            document.getElementById("back").addEventListener("click", () => {

                window.location.href = "../home/home.html";

            });


            // ADD TO CART FUNCTIONALITY
            document.getElementById("cart").addEventListener("click", () => {

                addingToCart(selectedProduct);

            });

        }

        else {

            productDetails.innerHTML = `
                <p>Product not available</p>
            `;

        }

    }

    else {

        productDetails.innerHTML = `
            <p>Product not found</p>
        `;

    }

});


// ADD TO CART FUNCTION
function addingToCart(product) {

    // Get existing cart
    let cart = JSON.parse(
        localStorage.getItem("cart")
    ) || [];


    // Add product to cart
    cart.push(product);


    // Save updated cart
    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );


    alert("Product added successfully!!!");
    window.location.href = "../cart/cart.html";

}

