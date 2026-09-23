/* ================= PRODUCT ARRAY ================= */

let productavailable = [];


/* ================= FETCH PRODUCTS ================= */

function fetchingdata() {

    fetch("https://dummyjson.com/products")

        .then((result) => {

            return result.json();

        })

        .then((val) => {

            // Store API products

            productavailable = val.products;


            // Store products in localStorage

            localStorage.setItem(
                "allproducts",
                JSON.stringify(productavailable)
            );


            // Display products

            displayproduct(productavailable);

        });

}


/* ================= CALL API FUNCTION ================= */

fetchingdata();


/* ================= DISPLAY PRODUCTS ================= */

function displayproduct(prod) {

    let output = "";


    prod.map((val, index) => {

        output += `

        <div class="product">


            <!-- IMAGE -->

            <div class="image">

                <img src="${val.thumbnail}">

            </div>


            <!-- PRODUCT DETAILS -->

            <div class="productdetails">


                <!-- PRODUCT NAME -->

                <h3>
                    ${val.title}
                </h3>


                <!-- RATING -->

                <div class="rating">

                    ⭐ ${val.rating}

                </div>


                <!-- PRICE -->

                <div class="price">

                    $${val.price}

                </div>


                <!-- STOCK + DETAILS -->

                <div class="stockrow">


                    <!-- STOCK -->

                    <p class="stock">

                        In Stock: ${val.stock}

                    </p>


                    <!-- DETAILS BUTTON -->

                    <button class="details" onclick="details(${val.id})">

                        Details

                    </button>


                </div>


            </div>

        </div>

        `;

    });


    /* ================= DISPLAY ================= */

    document.getElementById("productcontainer").innerHTML = output;

}
document.getElementById("searchproduct").addEventListener("input",(e)=>{
    let searchTerm=e.target.value.toLowerCase();
    let filterProduct=productavailable.filter((v)=>{
        return v.title.toLowerCase().includes(searchTerm) || v.category.toLowerCase().includes(searchTerm)
    })
    displayproduct(filterProduct)

})
function details(productid){
// console.log(productid);
localStorage.setItem("pid",productid);
window.location.href="../details/details.html";


}