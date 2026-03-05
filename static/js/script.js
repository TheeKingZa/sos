// Script
/* store products globally */
let products = []
let currentIndex = 0


fetch("./data/items.json")
.then(res => res.json())
.then(data => {

    /* filter products with price */
    products = data.products.filter(p => p.price && p.price > 0)

    renderProducts()

})


function renderProducts(){

    const container = document.getElementById("products")

    container.innerHTML = ""

    products.forEach((product,index)=>{

        /* fallback image if missing */
        let img = product.image || "../../logo.png"

        const card = document.createElement("div")
        card.className="product"

        card.innerHTML = `

        <img src="${img}" loading="lazy">

        <div class="product-info">

        <div class="brand">${product.brand}</div>

        <div>${product.name}</div>

        <div class="price">R${product.price.toFixed(2)}</div>

        </div>
        `

        /* open viewer */
        card.onclick = ()=>openViewer(index)

        container.appendChild(card)

    })

}


const viewer = document.getElementById("viewer")
const viewerImg = document.getElementById("viewerImg")


function openViewer(index){

    currentIndex = index

    showImage()

    viewer.style.display="flex"

}


function showImage(){

    let img = products[currentIndex].image || "../../logo.png"

    viewerImg.src = img

}


/* close viewer */
document.getElementById("closeViewer").onclick=()=>{

    viewer.style.display="none"

}


/* next image */
document.getElementById("next").onclick=()=>{

    currentIndex++

    if(currentIndex >= products.length)
        currentIndex = 0

    showImage()

}


/* previous image */
document.getElementById("prev").onclick=()=>{

    currentIndex--

    if(currentIndex < 0)
        currentIndex = products.length-1

    showImage()

}


/* swipe support */
let startX = 0

viewer.addEventListener("touchstart", e=>{

    startX = e.touches[0].clientX

})

viewer.addEventListener("touchend", e=>{

    let endX = e.changedTouches[0].clientX

    if(startX - endX > 50)
        document.getElementById("next").click()

    if(endX - startX > 50)
        document.getElementById("prev").click()

})
