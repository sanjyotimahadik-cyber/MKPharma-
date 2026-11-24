/*=========================================================
                MK ANIMAL HEALTH ERP
            PRODUCT MANAGEMENT MODULE
=========================================================*/


/*=========================================================
                    PRODUCT DATABASE
=========================================================*/

const products = [

    {
        id: 1,

        name: "AI Care",

        category: "Feed Supplement",

        price: 540,

        stock: 75,

        expiry: "2028-03-15",

        description:
            "Advanced nutritional feed supplement for improving immunity and overall animal health.",

        benefits: [
            "Improves immunity",
            "Supports healthy growth",
            "Enhances productivity"
        ],

        composition: [
            "Vitamins",
            "Minerals",
            "Herbal Extracts"
        ],

        indications: [
            "Weak animals",
            "Nutritional deficiency"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/ai-care/1.jpg",
            "../assets/products/ai-care/2.jpg"
        ]
    },

    {
        id: 2,

        name: "Calf Boost",

        category: "Feed Supplement",

        price: 320,

        stock: 120,

        expiry: "2028-05-12",

        description:
            "Liquid nutritional supplement specially formulated for healthy calf growth.",

        benefits: [
            "Improves growth",
            "Supports immunity",
            "Healthy digestion"
        ],

        composition: [
            "Calcium",
            "Vitamin D3",
            "Phosphorus"
        ],

        indications: [
            "Growing calves",
            "Poor growth"
        ],

        dosage: "50 ml daily",

        images: [
            "../assets/products/calf-boost/1.jpg",
            "../assets/products/calf-boost/2.jpg"
        ]
    },

    {
        id: 3,

        name: "Cal D Boost Gel",

        category: "Calcium",

        price: 460,

        stock: 68,

        expiry: "2028-08-25",

        description:
            "Calcium gel supplement for rapid calcium replenishment.",

        benefits: [
            "Supports bone strength",
            "Prevents calcium deficiency",
            "Improves recovery"
        ],

        composition: [
            "Calcium",
            "Vitamin D3"
        ],

        indications: [
            "Milk fever",
            "Calcium deficiency"
        ],

        dosage: "As directed by veterinarian",

        images: [
            "../assets/products/cal-d-boost-gel/1.jpg",
            "../assets/products/cal-d-boost-gel/2.jpg"
        ]
    },

    {
        id: 4,

        name: "HB Plus",

        category: "Feed Supplement",

        price: 395,

        stock: 88,

        expiry: "2028-06-18",

        description:
            "Supports haemoglobin formation and improves animal vitality.",

        benefits: [
            "Improves haemoglobin",
            "Reduces weakness",
            "Enhances energy"
        ],

        composition: [
            "Iron",
            "Vitamin B12",
            "Folic Acid"
        ],

        indications: [
            "Anaemia",
            "Weakness"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/hb-plus/1.jpg"
        ]
    },

    {
        id: 5,

        name: "Liv Plus",

        category: "Feed Supplement",

        price: 420,

        stock: 124,

        expiry: "2028-04-15",

        description:
            "Supports liver function and improves digestion in livestock.",

        benefits: [
            "Improves liver health",
            "Enhances appetite",
            "Supports digestion"
        ],

        composition: [
            "Herbal Extracts",
            "Vitamin B Complex"
        ],

        indications: [
            "Liver disorders",
            "Poor appetite"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/liv-plus/1.jpg",
            "../assets/products/liv-plus/2.jpg"
        ]
    },

    {
        id: 6,

        name: "Minvita Forte",

        category: "Feed Supplement",

        price: 510,

        stock: 95,

        expiry: "2028-09-30",

        description:
            "Complete vitamin and mineral supplement for livestock.",

        benefits: [
            "Boosts immunity",
            "Improves metabolism",
            "Supports productivity"
        ],

        composition: [
            "Vitamin A",
            "Vitamin D3",
            "Minerals"
        ],

        indications: [
            "Vitamin deficiency",
            "General weakness"
        ],

        dosage: "50 ml daily",

        images: [
            "../assets/products/minvita-forte/1.jpg",
            "../assets/products/minvita-forte/2.jpg",
            "../assets/products/minvita-forte/3.jpg",
            "../assets/products/minvita-forte/4.jpg"
        ]
    },

    {
        id: 7,

        name: "Miracal Gold",

        category: "Calcium",

        price: 580,

        stock: 56,

        expiry: "2028-07-20",

        description:
            "Premium calcium supplement for dairy animals during lactation.",

        benefits: [
            "Strengthens bones",
            "Improves milk production",
            "Supports lactation"
        ],

        composition: [
            "Calcium",
            "Magnesium",
            "Vitamin D3"
        ],

        indications: [
            "Calcium deficiency",
            "Lactating animals"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/miracal-gold/1.jpg",
            "../assets/products/miracal-gold/2.jpg"
        ]
    },
        {
        id: 8,

        name: "Stress Out",

        category: "Feed Supplement",

        price: 390,

        stock: 82,

        expiry: "2028-08-10",

        description:
            "Supports animals during transportation, heat stress and environmental changes.",

        benefits: [
            "Reduces stress",
            "Improves recovery",
            "Supports appetite"
        ],

        composition: [
            "Electrolytes",
            "Vitamin C",
            "B-Complex"
        ],

        indications: [
            "Transportation",
            "Heat stress"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/stress-out/1.jpg"
        ]
    },

    {
        id: 9,

        name: "Super Boost",

        category: "Feed Supplement",

        price: 470,

        stock: 64,

        expiry: "2028-06-28",

        description:
            "Premium nutritional supplement for improving growth and productivity.",

        benefits: [
            "Boosts immunity",
            "Healthy growth",
            "Improves performance"
        ],

        composition: [
            "Proteins",
            "Minerals",
            "Multivitamins"
        ],

        indications: [
            "Weak animals",
            "Growth support"
        ],

        dosage: "75 ml daily",

        images: [
            "../assets/products/super-boost/1.jpg",
            "../assets/products/super-boost/2.jpg"
        ]
    },

    {
        id: 10,

        name: "Utra Care",

        category: "Feed Supplement",

        price: 610,

        stock: 48,

        expiry: "2028-09-15",

        description:
            "Complete health supplement for improving overall livestock productivity.",

        benefits: [
            "Improves health",
            "Supports milk production",
            "Enhances immunity"
        ],

        composition: [
            "Minerals",
            "Vitamin Complex"
        ],

        indications: [
            "General weakness",
            "Nutritional deficiency"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/utra-care/1.jpg"
        ]
    },

    {
        id: 11,

        name: "Rumi Plus",

        category: "Feed Supplement",

        price: 360,

        stock: 92,

        expiry: "2028-04-20",

        description:
            "Supports rumen activity and improves digestion in cattle.",

        benefits: [
            "Improves digestion",
            "Better feed conversion",
            "Supports appetite"
        ],

        composition: [
            "Yeast Culture",
            "Minerals",
            "Vitamin B Complex"
        ],

        indications: [
            "Poor digestion",
            "Low feed intake"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/rumi-plus/1.jpg"
        ]
    },

    {
        id: 12,

        name: "Minvita Plus",

        category: "Feed Supplement",

        price: 470,

        stock: 110,

        expiry: "2028-10-18",

        description:
            "Daily vitamin supplement for maintaining healthy livestock.",

        benefits: [
            "Supports metabolism",
            "Improves immunity",
            "Healthy growth"
        ],

        composition: [
            "Vitamin A",
            "Vitamin E",
            "Trace Minerals"
        ],

        indications: [
            "Vitamin deficiency"
        ],

        dosage: "50 ml daily",

        images: [
            "../assets/products/minvita-plus/1.jpg"
        ]
    },

    {
        id: 13,

        name: "Miracal Platinum",

        category: "Calcium",

        price: 650,

        stock: 41,

        expiry: "2028-12-05",

        description:
            "Advanced calcium supplement with enhanced mineral support.",

        benefits: [
            "Bone strength",
            "Supports fertility",
            "Improves milk production"
        ],

        composition: [
            "Calcium",
            "Phosphorus",
            "Vitamin D3"
        ],

        indications: [
            "Calcium deficiency"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/miracal-platinum/1.jpg",
            "../assets/products/miracal-platinum/2.jpg",
            "../assets/products/miracal-platinum/3.jpg"
        ]
    },

    {
        id: 14,

        name: "Kasvadh-H",

        category: "Veterinary Medicine",

        price: 730,

        stock: 53,

        expiry: "2028-11-22",

        description:
            "Broad-spectrum veterinary medicine for bacterial infections.",

        benefits: [
            "Fast recovery",
            "Effective treatment",
            "Broad-spectrum action"
        ],

        composition: [
            "Ceftriaxone"
        ],

        indications: [
            "Bacterial infections"
        ],

        dosage: "Use only as directed by veterinarian.",

        images: [
            "../assets/products/kasvadh-h/1.jpg",
            "../assets/products/kasvadh-h/2.jpg"
        ]
    },
        {
        id: 15,

        name: "Masti-Out",

        category: "Veterinary Medicine",

        price: 690,

        stock: 42,

        expiry: "2028-07-18",

        description:
            "Veterinary formulation for effective mastitis management in dairy animals.",

        benefits: [
            "Supports udder health",
            "Fast recovery",
            "Improves milk quality"
        ],

        composition: [
            "Antibacterial Agents",
            "Anti-inflammatory Ingredients"
        ],

        indications: [
            "Clinical Mastitis",
            "Subclinical Mastitis"
        ],

        dosage: "Use only under veterinary supervision.",

        images: [
            "../assets/products/masti-out/1.jpg",
            "../assets/products/masti-out/2.jpg",
            "../assets/products/masti-out/3.jpg",
            "../assets/products/masti-out/4.jpg"
        ]
    },

    {
        id: 16,

        name: "Phos-Grow",

        category: "Feed Supplement",

        price: 495,

        stock: 76,

        expiry: "2028-10-12",

        description:
            "Phosphorus supplement for healthy growth and improved metabolism.",

        benefits: [
            "Improves growth",
            "Supports bone development",
            "Enhances productivity"
        ],

        composition: [
            "Phosphorus",
            "Calcium",
            "Vitamin D3"
        ],

        indications: [
            "Phosphorus deficiency"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/phos-grow/1.jpg",
            "../assets/products/phos-grow/2.jpg"
        ]
    },

    {
        id: 17,

        name: "Prosacc",

        category: "Feed Supplement",

        price: 450,

        stock: 98,

        expiry: "2028-08-28",

        description:
            "Probiotic feed supplement for improving rumen health and digestion.",

        benefits: [
            "Improves digestion",
            "Better feed conversion",
            "Healthy gut flora"
        ],

        composition: [
            "Probiotics",
            "Yeast Culture"
        ],

        indications: [
            "Poor digestion",
            "Digestive imbalance"
        ],

        dosage: "50 gm daily",

        images: [
            "../assets/products/prosacc/1.jpg"
        ]
    },

    {
        id: 18,

        name: "Silo-Strong",

        category: "Feed Supplement",

        price: 620,

        stock: 57,

        expiry: "2028-09-22",

        description:
            "Silage enhancer for better feed preservation and nutritional value.",

        benefits: [
            "Improves silage quality",
            "Reduces spoilage",
            "Better nutrient retention"
        ],

        composition: [
            "Beneficial Bacteria",
            "Organic Acids"
        ],

        indications: [
            "Silage preparation"
        ],

        dosage: "As recommended during silage preparation.",

        images: [
            "../assets/products/silo-strong/1.jpg",
            "../assets/products/silo-strong/2.jpg"
        ]
    },

    {
        id: 19,

        name: "Mustivet",

        category: "Veterinary Medicine",

        price: 780,

        stock: 34,

        expiry: "2028-12-02",

        description:
            "Veterinary medicine for effective infection management.",

        benefits: [
            "Rapid recovery",
            "Broad-spectrum action"
        ],

        composition: [
            "Antibacterial Agents"
        ],

        indications: [
            "Bacterial infections"
        ],

        dosage: "As prescribed by veterinarian.",

        images: [
            "../assets/products/mustivet/1.jpg"
        ]
    },

    {
        id: 20,

        name: "Fentop Plus",

        category: "Veterinary Medicine",

        price: 860,

        stock: 26,

        expiry: "2028-11-08",

        description:
            "Veterinary injectable formulation for severe bacterial infections.",

        benefits: [
            "Fast acting",
            "Effective treatment",
            "Reliable recovery"
        ],

        composition: [
            "Advanced Antibiotic Formula"
        ],

        indications: [
            "Severe infections"
        ],

        dosage: "Use only under veterinary supervision.",

        images: [
            "../assets/products/fentop-plus/1.jpg",
            "../assets/products/fentop-plus/2.jpg"
        ]
    },

    {
        id: 21,

        name: "Mkomplex",

        category: "Feed Supplement",

        price: 360,

        stock: 91,

        expiry: "2028-08-16",

        description:
            "Vitamin and mineral supplement for improving overall livestock health.",

        benefits: [
            "Improves metabolism",
            "Supports immunity",
            "Healthy growth"
        ],

        composition: [
            "Vitamin A",
            "Vitamin D3",
            "Minerals"
        ],

        indications: [
            "Vitamin deficiency",
            "General weakness"
        ],

        dosage: "50 ml daily",

        images: [
            "../assets/products/mkomplex/1.jpg",
            "../assets/products/mkomplex/2.jpg"
        ]
    },
        {
        id: 22,

        name: "Ceftur",

        category: "Veterinary Medicine",

        price: 890,

        stock: 39,

        expiry: "2028-10-15",

        description:
            "Broad-spectrum antibiotic for effective treatment of bacterial infections in livestock.",

        benefits: [
            "Fast recovery",
            "Broad-spectrum antibacterial action",
            "Reliable treatment"
        ],

        composition: [
            "Ceftiofur"
        ],

        indications: [
            "Respiratory infections",
            "Bacterial diseases"
        ],

        dosage: "Use only under veterinary supervision.",

        images: [
            "../assets/products/ceftur/1.jpg",
            "../assets/products/ceftur/2.jpg"
        ]
    },

    {
        id: 23,

        name: "Meloxi-Plus",

        category: "Veterinary Medicine",

        price: 640,

        stock: 58,

        expiry: "2028-08-24",

        description:
            "Anti-inflammatory and analgesic veterinary formulation.",

        benefits: [
            "Reduces pain",
            "Controls inflammation",
            "Improves recovery"
        ],

        composition: [
            "Meloxicam"
        ],

        indications: [
            "Pain",
            "Inflammation",
            "Post-operative care"
        ],

        dosage: "As prescribed by veterinarian.",

        images: [
            "../assets/products/meloxi-plus/1.jpg",
            "../assets/products/meloxi-plus/2.jpg"
        ]
    },

    {
        id: 24,

        name: "Ceftim-TAZO",

        category: "Veterinary Medicine",

        price: 980,

        stock: 31,

        expiry: "2028-11-19",

        description:
            "Combination antibiotic for severe bacterial infections.",

        benefits: [
            "Powerful antibacterial activity",
            "Fast recovery",
            "Broad spectrum"
        ],

        composition: [
            "Ceftazidime",
            "Tazobactam"
        ],

        indications: [
            "Serious bacterial infections"
        ],

        dosage: "Use only under veterinary supervision.",

        images: [
            "../assets/products/ceftim-tazo/1.jpg",
            "../assets/products/ceftim-tazo/2.jpg"
        ]
    },

    {
        id: 25,

        name: "Bupalex",

        category: "Veterinary Medicine",

        price: 720,

        stock: 47,

        expiry: "2028-07-30",

        description:
            "Veterinary analgesic formulation for pain management.",

        benefits: [
            "Pain relief",
            "Improves mobility",
            "Fast acting"
        ],

        composition: [
            "Buprenorphine"
        ],

        indications: [
            "Pain management"
        ],

        dosage: "Use only as directed by veterinarian.",

        images: [
            "../assets/products/bupalex/1.jpg",
            "../assets/products/bupalex/2.jpg"
        ]
    },

    {
        id: 26,

        name: "Metaphos-C",

        category: "Feed Supplement",

        price: 520,

        stock: 79,

        expiry: "2028-09-11",

        description:
            "Metabolic and phosphorus supplement for dairy animals.",

        benefits: [
            "Improves metabolism",
            "Supports energy production",
            "Enhances productivity"
        ],

        composition: [
            "Phosphorus",
            "Vitamin C",
            "Minerals"
        ],

        indications: [
            "Metabolic disorders"
        ],

        dosage: "100 ml daily",

        images: [
            "../assets/products/metaphos-c/1.jpg"
        ]
    },

    {
        id: 27,

        name: "Pletgrow",

        category: "Feed Supplement",

        price: 470,

        stock: 96,

        expiry: "2028-10-05",

        description:
            "Supports healthy growth and improved feed utilization.",

        benefits: [
            "Healthy growth",
            "Improves feed conversion",
            "Supports immunity"
        ],

        composition: [
            "Proteins",
            "Vitamins",
            "Minerals"
        ],

        indications: [
            "Growth support"
        ],

        dosage: "75 ml daily",

        images: [
            "../assets/products/pletgrow/1.jpg",
            "../assets/products/pletgrow/2.jpg",
            "../assets/products/pletgrow/3.jpg"
        ]
    },

    {
        id: 28,

        name: "Zatakaa",

        category: "Veterinary Medicine",

        price: 850,

        stock: 36,

        expiry: "2028-12-28",

        description:
            "Veterinary antiparasitic formulation for livestock.",

        benefits: [
            "Controls parasites",
            "Improves animal health",
            "Fast acting"
        ],

        composition: [
            "Antiparasitic Formula"
        ],

        indications: [
            "Internal and external parasites"
        ],

        dosage: "Use only under veterinary supervision.",

        images: [
            "../assets/products/zatakaa/1.jpg"
        ]
    }
];


/*=========================================================
                GLOBAL VARIABLES
=========================================================*/

let filteredProducts = [...products];

let selectedProduct = null;

let currentImageIndex = 0;
/*=========================================================
                    DOM ELEMENTS
=========================================================*/

/*---------- Product Grid ----------*/

const productGrid = document.getElementById("productGrid");


/*---------- Toolbar ----------*/

const searchInput = document.getElementById("searchProduct");

const categoryFilter = document.getElementById("categoryFilter");

const sortFilter = document.getElementById("sortProducts");

const addProductBtn = document.getElementById("addProduct");


/*---------- Statistics ----------*/

const totalProducts = document.querySelector(".stats .stat-card:nth-child(1) h2");

const totalFeed = document.querySelector(".stats .stat-card:nth-child(2) h2");

const totalMedicine = document.querySelector(".stats .stat-card:nth-child(3) h2");

const lowStock = document.querySelector(".stats .stat-card:nth-child(4) h2");

const expiredProducts = document.querySelector(".stats .stat-card:nth-child(5) h2");


/*---------- Product Modal ----------*/

const productModal = document.getElementById("productModal");

const modalImage = document.getElementById("modalImage");

const modalTitle = document.getElementById("modalTitle");

const modalPrice = document.getElementById("modalPrice");

const modalBenefits = document.getElementById("modalBenefits");

const modalComposition = document.getElementById("modalComposition");

const modalIndications = document.getElementById("modalIndications");

const modalDosage = document.getElementById("modalDosage");

const modalStock = document.getElementById("modalStock");

const modalExpiry = document.getElementById("modalExpiry");

const closeModalBtn = document.getElementById("closeModal");

const previousImageBtn = document.getElementById("previousImage");

const nextImageBtn = document.getElementById("nextImage");

/*=========================================================
            PRODUCT FORM MODAL
=========================================================*/

const productFormModal = document.getElementById("productFormModal");

const productForm = document.getElementById("productForm");

const formTitle = document.getElementById("formTitle");

const closeFormBtn = document.getElementById("closeForm");

const cancelFormBtn = document.getElementById("cancelForm");

const saveProductBtn = document.getElementById("saveProduct");


/*---------- Form Fields ----------*/

const productNameInput = document.getElementById("productName");

const productCategoryInput = document.getElementById("productCategory");

const productPriceInput = document.getElementById("productPrice");

const productStockInput = document.getElementById("productStock");

const productExpiryInput = document.getElementById("productExpiry");

const productDescriptionInput = document.getElementById("productDescription");

const productBenefitsInput = document.getElementById("productBenefits");

const productCompositionInput = document.getElementById("productComposition");

const productIndicationsInput = document.getElementById("productIndications");

const productDosageInput = document.getElementById("productDosage");

const productImagesInput = document.getElementById("productImages");

const imagePreview = document.getElementById("imagePreview");


/*---------- Edit Mode ----------*/

let editingProductId = null;

/*=========================================================
                HELPER FUNCTIONS
=========================================================*/

function getProductStatus(stock){

    if(stock <= 0){

        return "Expired";

    }

    if(stock <= 20){

        return "Low Stock";

    }

    return "In Stock";

}



function getStatusColor(status){

    switch(status){

        case "In Stock":

            return "#16A34A";

        case "Low Stock":

            return "#F59E0B";

        case "Expired":

            return "#DC2626";

        default:

            return "#64748B";

    }

}



function getStatusBackground(status){

    switch(status){

        case "In Stock":

            return "#DCFCE7";

        case "Low Stock":

            return "#FEF3C7";

        case "Expired":

            return "#FEE2E2";

        default:

            return "#F1F5F9";

    }

}

/*=========================================================
                CREATE PRODUCT CARD
=========================================================*/

function createProductCard(product){

    const status = getProductStatus(product.stock);

    return `

    <div class="product-card" data-id="${product.id}">

        <div class="product-slider">

            <img
                src="${product.images[0]}"
                alt="${product.name}"
                class="product-image">

        </div>

        <div class="product-info">

            <h2>${product.name}</h2>

            <h3>₹${product.price}</h3>

            <p>${product.category}</p>

            <span
                class="status-badge"
                style="
                    color:${getStatusColor(status)};
                    background:${getStatusBackground(status)};
                ">

                ${status}

            </span>

        </div>

        <div class="product-buttons">

            <button
                class="update-btn"
                data-id="${product.id}">

                <i class="fa-solid fa-pen"></i>

                Update

            </button>

            <button
                class="delete-btn"
                data-id="${product.id}">

                <i class="fa-solid fa-trash"></i>

                Delete

            </button>

        </div>

    </div>

    `;

}


/*=========================================================
                RENDER PRODUCT GRID
=========================================================*/

function renderProducts(productList){

    productGrid.innerHTML = "";

    if(productList.length === 0){

        productGrid.innerHTML = `

        <div
            style="
                grid-column:1/-1;
                text-align:center;
                padding:80px;
                font-size:22px;
                color:#64748B;
            ">

            No Products Found

        </div>

        `;

        return;

    }

    productList.forEach(product=>{

        productGrid.innerHTML += createProductCard(product);

    });

}



/*=========================================================
                UPDATE DASHBOARD STATISTICS
=========================================================*/

function updateStatistics(){

    totalProducts.textContent = products.length;

    totalFeed.textContent =

        products.filter(product=>

            product.category==="Feed Supplement"

        ).length;

    totalMedicine.textContent =

        products.filter(product=>

            product.category==="Veterinary Medicine"

        ).length;

    lowStock.textContent =

        products.filter(product=>

            product.stock<=20 && product.stock>0

        ).length;

    expiredProducts.textContent =

        products.filter(product=>

            product.stock<=0

        ).length;

}



/*=========================================================
                    INITIAL LOAD
=========================================================*/

renderProducts(filteredProducts);

updateStatistics();

console.log("Product Management Loaded Successfully");

/*=========================================================
                APPLY FILTERS
=========================================================*/

function applyFilters(){

    let result = [...products];


    /*---------------- Search ----------------*/

    const keyword = searchInput.value.trim().toLowerCase();

    if(keyword !== ""){

        result = result.filter(product =>

            product.name.toLowerCase().includes(keyword)

        );

    }


    /*-------------- Category ---------------*/

    const category = categoryFilter.value;

    if(category !== "All"){

        result = result.filter(product =>

            product.category === category

        );

    }


    /*---------------- Sort ----------------*/

    switch(sortFilter.value){

        case "name":

            result.sort((a,b)=>

                a.name.localeCompare(b.name)

            );

        break;


        case "price":

            result.sort((a,b)=>

                a.price-b.price

            );

        break;


        case "stock":

            result.sort((a,b)=>

                b.stock-a.stock

            );

        break;

    }


    filteredProducts = result;

    renderProducts(filteredProducts);

}



/*=========================================================
                SEARCH PRODUCTS
=========================================================*/

searchInput.addEventListener("input",()=>{

    applyFilters();

});



/*=========================================================
                CATEGORY FILTER
=========================================================*/

categoryFilter.addEventListener("change",()=>{

    applyFilters();

});



/*=========================================================
                    SORT PRODUCTS
=========================================================*/

sortFilter.addEventListener("change",()=>{

    applyFilters();

});
/*=========================================================
                OPEN PRODUCT POPUP
=========================================================*/

function openProduct(productId){

    selectedProduct = products.find(product =>

        product.id === productId

    );

    if(!selectedProduct) return;

    currentImageIndex = 0;

    loadProductImage();


    /*---------------- Title ----------------*/

    modalTitle.textContent = selectedProduct.name;


    /*---------------- Price ----------------*/

    modalPrice.textContent =

        "₹" + selectedProduct.price;


    /*---------------- Benefits ----------------*/

    modalBenefits.innerHTML =

    `
    <div class="detail-box">

        <h4>Benefits</h4>

        <ul>

            ${selectedProduct.benefits
                .map(item=>`<li>${item}</li>`)
                .join("")}

        </ul>

    </div>
    `;


    /*---------------- Composition ----------------*/

    modalComposition.innerHTML =

    `
    <div class="detail-box">

        <h4>Composition</h4>

        <ul>

            ${selectedProduct.composition
                .map(item=>`<li>${item}</li>`)
                .join("")}

        </ul>

    </div>
    `;


    /*---------------- Indications ----------------*/

    modalIndications.innerHTML =

    `
    <div class="detail-box">

        <h4>Indications</h4>

        <ul>

            ${selectedProduct.indications
                .map(item=>`<li>${item}</li>`)
                .join("")}

        </ul>

    </div>
    `;


    /*---------------- Dosage ----------------*/

    modalDosage.innerHTML =

    `
    <div class="detail-box">

        <h4>Dosage</h4>

        <p>${selectedProduct.dosage}</p>

    </div>
    `;


    /*---------------- Stock ----------------*/

    modalStock.innerHTML =

    `
    <div class="detail-box">

        <h4>Available Stock</h4>

        <p>${selectedProduct.stock} Units</p>

    </div>
    `;


    /*---------------- Expiry ----------------*/

    modalExpiry.innerHTML =

    `
    <div class="detail-box">

        <h4>Expiry Date</h4>

        <p>${selectedProduct.expiry}</p>

    </div>
    `;


    /*---------------- Show Popup ----------------*/

    productModal.style.display = "flex";

}



/*=========================================================
                LOAD PRODUCT IMAGE
=========================================================*/

function loadProductImage(){

    modalImage.src =

    selectedProduct.images[currentImageIndex];

}



/*=========================================================
            CLICK PRODUCT CARD TO OPEN POPUP
=========================================================*/

document.addEventListener("click",(event)=>{

    const card = event.target.closest(".product-card");

    if(!card) return;

    if(event.target.closest(".update-btn")) return;

    if(event.target.closest(".delete-btn")) return;

    const productId = Number(card.dataset.id);

    openProduct(productId);

});

/*=========================================================
            UPDATE PRODUCT BUTTON
=========================================================*/

document.addEventListener("click", (event) => {

    const updateButton = event.target.closest(".update-btn");

    if(!updateButton) return;

    event.stopPropagation();

    const productId = Number(updateButton.dataset.id);

    openUpdateForm(productId);

});

/*=========================================================
                NEXT PRODUCT IMAGE
=========================================================*/

nextImageBtn.addEventListener("click",()=>{

    if(!selectedProduct) return;

    currentImageIndex++;

    if(currentImageIndex >= selectedProduct.images.length){

        currentImageIndex = 0;

    }

    loadProductImage();

});


/*=========================================================
            PREVIOUS PRODUCT IMAGE
=========================================================*/

previousImageBtn.addEventListener("click",()=>{

    if(!selectedProduct) return;

    currentImageIndex--;

    if(currentImageIndex < 0){

        currentImageIndex =

        selectedProduct.images.length - 1;

    }

    loadProductImage();

});


/*=========================================================
                CLOSE PRODUCT POPUP
=========================================================*/

function closeProductPopup(){

    console.log("Popup Closed");

    productModal.style.display = "none";

    selectedProduct = null;

    currentImageIndex = 0;

}

/*=========================================================
            OPEN UPDATE FORM
=========================================================*/

function openUpdateForm(productId){

    const product = products.find(p => p.id === productId);

    if(!product) return;

    editingProductId = product.id;

    formTitle.textContent = "Update Product";

    saveProductBtn.textContent = "Update Product";

    productNameInput.value = product.name;

    productCategoryInput.value = product.category;

    productPriceInput.value = product.price;

    productStockInput.value = product.stock;

    productExpiryInput.value = product.expiry;

    productDescriptionInput.value = product.description;

    productBenefitsInput.value = product.benefits.join("\n");

    productCompositionInput.value = product.composition.join("\n");

    productIndicationsInput.value = product.indications.join("\n");

    productDosageInput.value = product.dosage;

    imagePreview.innerHTML = "";

    product.images.forEach(image => {

        imagePreview.innerHTML +=
        `<img src="${image}" alt="Preview">`;

    });

    productFormModal.style.display = "flex";

}

/*=========================================================
                CLOSE BUTTON
=========================================================*/

closeModalBtn.addEventListener("click", function(event){

    event.preventDefault();

    event.stopPropagation();

    console.log("Close button clicked");

    closeProductPopup();

});



/*=========================================================
            CLICK OUTSIDE TO CLOSE
=========================================================*/

productModal.addEventListener("click",(event)=>{

    if(event.target === productModal){

        closeProductPopup();

    }

});



/*=========================================================
                ESC KEY CLOSE
=========================================================*/

document.addEventListener("keydown",(event)=>{

    if(event.key === "Escape"){

        closeProductPopup();

    }

});
/*=========================================================
        OPEN ADD PRODUCT FORM
=========================================================*/

addProductBtn.addEventListener("click", () => {

    editingProductId = null;

    formTitle.textContent = "Add Product";

    productForm.reset();

    imagePreview.innerHTML = "";

    productFormModal.style.display = "flex";

});


/*=========================================================
        CLOSE PRODUCT FORM
=========================================================*/

function closeProductForm(){

    productFormModal.style.display = "none";

}


/*=========================================================
        CLOSE BUTTON
=========================================================*/

closeFormBtn.addEventListener("click", closeProductForm);

cancelFormBtn.addEventListener("click", closeProductForm);


/*=========================================================
        CLICK OUTSIDE
=========================================================*/

productFormModal.addEventListener("click",(event)=>{

    if(event.target===productFormModal){

        closeProductForm();

    }

});


/*=========================================================
        ESC KEY
=========================================================*/

document.addEventListener("keydown",(event)=>{

    if(event.key==="Escape"){

        closeProductForm();

    }

});

/*=========================================================
                DELETE PRODUCT
=========================================================*/

document.addEventListener("click",(event)=>{

    const deleteButton = event.target.closest(".delete-btn");

    if(!deleteButton) return;

    event.stopPropagation();

    const productId = Number(deleteButton.dataset.id);

    deleteProduct(productId);

});

/*=========================================================
                DELETE FUNCTION
=========================================================*/

function deleteProduct(productId){

    const confirmDelete = confirm(

        "Are you sure you want to delete this product?"

    );

    if(!confirmDelete) return;

    const index = products.findIndex(

        product => product.id === productId

    );

    if(index === -1) return;

    products.splice(index,1);

    renderProducts(products);

    updateStatistics();

}