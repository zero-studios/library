import { gsap } from "gsap";
import { hasClass } from "../../_global/helpers";
import { InitCart } from "./Cart";
// import { globalStorage } from "../../_global/storage";

/*  
	Constructs the Mini Cart
-------------------------------------------------- */
export const BuildMiniCart = (cart)=>{

	let miniCart = document.getElementById("mini-cart");

	let cartInfo = returnCartInfo(cart);
	let quantity = cartInfo.quantity;
	let total = cartInfo.total;

	// Display Cart Quantity
	let cartNumbers = document.getElementsByClassName("cart-quantity");

	Array.prototype.slice.call(cartNumbers).forEach((elem)=>{
		elem.textContent = quantity;
	});

	// Display Cart Total
	let cartTotal = document.getElementsByClassName("cart-total");

	Array.prototype.slice.call(cartTotal).forEach((elem)=>{
		elem.textContent = "$" + total.toLocaleString("en-US", { minimumFractionDigits: 2 });
	});

	// Check for mini cart
	if(miniCart){

		let miniCartProducts = document.getElementById("mini-cart-products");

		// Grab Mini Cart HTML
		let miniCartHTML = returnMiniCartHTML(cart);

		// Fade out
		gsap.to(miniCartProducts, 0.3, { opacity: 0, onComplete: function(){

			// Write HTML to container
			miniCartProducts.innerHTML = miniCartHTML;

			// Bind events to the mini cart Html
			InitCart();

			// Fade in
			gsap.to(miniCartProducts, 0.3, { opacity: 1 });

			// Open Mini-cart
			if(!hasClass(miniCart, "active")){
				miniCart.className += " active";
			}
		}});
		
	} else {

		// User Feedback if Mini-Cart is OFF
	}
};

/*  
	Form Mini-Cart HTML

	- The HTML currently in here is required
-------------------------------------------------- */
const returnMiniCartHTML = (object)=>{

	let html = `
		<form id="mini-cart-form" class="cart-form" method="post" action="/server/shopify-endpoints.php" enctype="multipart/form-data">
			<input type="hidden" name="type" value="update-cart" />
			<input type="hidden" name="token" value="update-cart" />
	`;

	Array.prototype.slice.call(object).forEach((item, key)=>{

		/* ----- Product ----- */
		html += `
			<article class="line-item" data-id="${item.node.variant.id}" data-quantity="${item.node.quantity}">
				<div class="hidden visuallyhidden">
					<input type="hidden" name="[cart][${key}][variantId]" value="${item.node.variant.id}" />
					<input type="number" name="[cart][${key}][quantity]" value="${item.node.quantity}" />
				</div>
				<div class="line-item-info">
					<h1>${item.node.title}</h1>
				</div>
				<div class="increment-wrapper">
					<button name="decrease item quantity" aria-label="decrease item quantity" type="button" class="increment" data-type="minus">-</button>
					<span class="count">${item.node.quantity}</span>
					<button name="increase item quantity" aria-label="increase item quantity" type="button" class="increment" data-type="plus">+</button>
				</div>
				<div class="actions">
					<button name="remove item" aria-label="remove item" type="button" class="cart-remove">Remove X</button>
				</div>
			</article>
		`;
	});

	html += `</form>`;

	return html;
};

/*  
	Get Cart Total & Quantity
-------------------------------------------------- */
const returnCartInfo = (object)=>{

	let quantity = 0;
	let total = 0;

	Array.prototype.slice.call(object).forEach((item)=>{
		quantity = quantity + item.node.quantity;
		total = total + (item.node.quantity * parseFloat(item.node.variant.price));
	});

	let obj = {
		total: total,
		quantity: quantity
	};

	return obj;
};