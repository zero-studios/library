import * as cookies from "js-cookie";
import * as serialize from "form-serialize";
import { gsap, Power3 } from "gsap";
import { ajax, hasClass } from "@zero-studios/library";
import { globalStorage } from "../../_global/storage";
import { reformatCheckoutUrl } from "../../_global/helpers";
import { BuildMiniCart } from "./MiniCart";

/*
	Shopify Class
-------------------------------------------------- */
export class Shopify {

	constructor(){
		this.checkout = (cookies.get("cart")) ? cookies.get("cart") : undefined;
		this.cart = undefined;
		this.lock = false;
		this.miniCartOpen = false;
	}

	/*
	 * init
	 *	- Initialize Shopify
	 */
	init(){

		let request = {
			url: "carts/" + this.checkout
		};

		/* --- Let's get our cached cart --- */
		if(this.checkout){

			ajax("/v1/cache/get/", {
				method: "POST",
				type: "json",
				data: JSON.stringify(request)
			}, (result)=>{

				/* --- Set cart --- */
				this.cart = JSON.parse(result);
				this.url = reformatCheckoutUrl(this.cart.webUrl);
				this.baseline = this.getBaseline(this.cart.lineItems.edges);

				/* --- Build our mini cart --- */
				this.buildMiniCart({ open: false });
				this.displayBaseline();

				globalStorage.checkout = this.checkout;
				globalStorage.cart = this.cart;
			});

		/* --- Else do some basic setup --- */			
		} else {

			this.buildMiniCart({ open: false });
			this.baseline = this.getBaseline([]);
			this.displayBaseline();
		}

		/* --- Catch our remaining binds --- */
		this.bindCartTrigger();
	}

	/*
	 * getBaseline
	 *	- Put together an object of our totals for display
	 */
	getBaseline(cart){

		let quantity = 0;
		let total = 0;

		/* --- Add in our baseline totals --- */
		Array.prototype.slice.call(cart).forEach((item)=>{
			quantity = quantity + item.node.quantity;
			total = total + (item.node.quantity * parseFloat(item.node.variant.price));
		});

		let object = {
			total: total,
			quantity: quantity
		}

		return object;
	}

	/*
	 * displayBaseline
	 *	- Write our baseline totals to the DOM, total price, total products in cart
	 */
	displayBaseline(options = {}){

		let numberElem = (typeof options.numberElemClass === "undefined") ? document.getElementsByClassName("cart-quantity") : document.getElementsByClassName(options.numberElemClass);
		let totalElem = (typeof options.totalElemClass === "undefined") ? document.getElementsByClassName("cart-total") : document.getElementsByClassName(options.totalElemClass);

		/* --- Display our baseline text --- */
		Array.prototype.slice.call(numberElem).forEach((elem)=>{
			elem.textContent = this.baseline.quantity;
		});

		/* --- Display our baseline totals --- */
		// !!! TODO: Write this to understand local currency format
		Array.prototype.slice.call(totalElem).forEach((elem)=>{
			elem.textContent = "$" + this.baseline.total.toLocaleString("en-US", { minimumFractionDigits: 2 });
		});
	}

	/*
	 * buildMiniCart
	 *	- Put together an object of our totals for display
	 */
	buildMiniCart(options = {}){

		/* --- Mini Cart defaults --- */
		let miniCart = (typeof options.elem === "undefined") ? document.getElementById("mini-cart") : options.elem;
		let openMini = (typeof options.open === "undefined") ? true : false;

		/* --- No mini-cart? no problem, just return --- */
		if(!miniCart) return;

		let miniCartProductWrapper = document.getElementById("mini-cart-products");
		let cart = (this.cart && this.cart.lineItems) ? this.cart.lineItems.edges : [];
		let miniCartHTML = this.returnMiniCartHTML(cart);

		/* --- Let's fade out the products warpper --- */
		gsap.to(miniCartProductWrapper, 0.3, { opacity: 0, onComplete: ()=>{

			/* --- Write our new cart products to the products wrapper --- */
			miniCartProductWrapper.innerHTML = miniCartHTML;

			/* --- Bind our mini cart events --- */
			this.bindCartEvents();

			/* --- Fade in the products wrapper --- */
			gsap.to(miniCartProductWrapper, 0.3, { opacity: 1 });

			/* --- Open mini cart --- */
			if(openMini) this.openMiniCart();
		}});
	}

	/*
	 * bindCartTrigger
	 *	- bind the miniCart events
	 */
	bindCartTrigger(){

		let triggers = document.getElementsByClassName("mini-cart-trigger");

		Array.prototype.slice.call(triggers).forEach((trigger)=>{

			trigger.addEventListener("click", (event)=>{

				event.preventDefault();

				if(!this.miniCartOpen){
					this.openMiniCart();
				} else {
					this.closeMiniCart();
				}
			});
		});
	}

	/*
	 * openMiniCart
	 *	- Open the miniCart
	 */
	openMiniCart(){

		// !!! TODO: Standardize how to open the miniCart
		if(this.miniCartOpen) return;

		let miniCart = document.getElementById("mini-cart");

		gsap.to(miniCart, 0.5, { x: "0%", ease: Power3.easeOut });

		this.miniCartOpen = true;
	}

	/*
	 * closeMiniCart
	 *	- Close the miniCart
	 */
	closeMiniCart(){

		// !!! TODO: Standardize how to close the miniCart
		if(!this.miniCartOpen) return;

		let miniCart = document.getElementById("mini-cart");

		gsap.to(miniCart, 0.5, { x: "100%", ease: Power3.easeIn });

		this.miniCartOpen = false;
	}

	/*
	 * returnMiniCartHTML
	 *	- Form our mini cart HTML
	 */
	returnMiniCartHTML(cart){

		let html = `<form id="mini-cart-form" class="cart-form" method="post" action="/v1/app/cart/update/" enctype="multipart/form-data">`;

		console.log(cart);

		/* --- Loop through products --- */
		Array.prototype.slice.call(cart).forEach((item, key)=>{

			/* --- Product --- */
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
	}

	/*
	 * bindCartEvents
	 *	- Bind our cart events
	 */
	bindCartEvents(options = {}){

		/* --- Cart defaults --- */
		let cartForms = (typeof options.cartFormClass === "undefined") ? document.getElementsByClassName("cart-form") : document.getElementsByClassName(options.cartFormClass);
		let removeButtons = (typeof options.removeButtonClass === "undefined") ? document.getElementsByClassName("cart-remove") : document.getElementsByClassName(options.removeButtonClass);

		/* --- Bind our forms --- */
		Array.prototype.slice.call(cartForms).forEach((form)=>{

			/* --- Only bind once --- */
			if(hasClass(form, "bound")) return;

			form.classList.add("bound");
			form.addEventListener("submit", (event)=>{

				event.preventDefault();
			});
		});

		/* --- Bind our remove buttons --- */
		Array.prototype.slice.call(removeButtons).forEach((btn)=>{

			/* --- Only bind once --- */
			if(hasClass(btn, "bound")) return;

			btn.classList.add("bound");
			btn.addEventListener("click", (event)=>{

				/* --- Walk the DOM to get product --- */
				// !!! TODO: Redo this to not be heirarchy dependent
				let product = btn.parentElement.parentElement;

				/* --- Remove product from DOM --- */
				product.remove();

				this.updateCart();
			});
		});

		/* --- Setup our Increments --- */
	}

	/*
	 * submitData
	 *	- This submits our cart data
	 */
	submitData(form, data, callback = null){

		this.lock = true;

		/* --- Submit our form --- */
		ajax(form.action, {
			method: form.method,
			type: "json",
			data: JSON.stringify(data)
		}, (result)=>{

			let json = JSON.parse(result);

			/* --- Return on error --- */
			if(json.error){

				callback(json.error);

				return;
			}

			/* --- Setup data variables --- */
			this.cart = json.request.checkout;
			this.checkout = this.cart.id;
			this.url = reformatCheckoutUrl(this.cart.webUrl);

			globalStorage.checkout = this.checkout;
			globalStorage.cart = this.cart;

			/* --- Update our prices displayed --- */
			this.baseline = this.getBaseline(this.cart.lineItems.edges);
			this.displayBaseline();

			/* --- Build the mini cart --- */
			this.buildMiniCart();

			/* --- Unlock our events --- */
			this.lock = false;

			/* --- callback --- */
			callback("Cart updated successfully");
		});
	}

	/*
	 * updateData
	 *	- This runs to update our DOM & object data after addToCart / updateCart
	 */
	updateData(){

	}

	/*
	 * updateCart
	 *	- Update our cart object by resubmitting the form
	 */
	updateCart(){

		/* --- Return if locked --- */
		if(this.lock) return;

		// !!! TODO: one day remove the /cart page and build in a mini-cart view
		let cartForm = document.getElementById("cart-form");
		let form = (cartForm) ? cartForm : document.getElementById("mini-cart-form");
		let object = serialize(form, { hash:true, isJSON: true });

		/* --- Add in our checkout id --- */
		object.checkout = {
			id: this.checkout
		};

		let productsArray = [];

		/* --- Loop through products --- */
		Array.prototype.slice.call(object.cart).forEach((item)=>{

			/* --- Normalize the Cart object --- */
			productsArray.push({ "quantity": parseInt(item.quantity), "variantId": item.variantId });
		});

		object.cart = productsArray;

		this.submitData(form, object);
	}
}