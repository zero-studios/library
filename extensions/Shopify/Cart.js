import { ajax, hasClass, reformatCheckoutUrl } from "../../_global/helpers";
import { globalStorage } from "../../_global/storage";
import { SetupIncrements } from "./Increment";
import { $shopify } from "../../_initialize";
import { BuildMiniCart } from "./MiniCart";
import * as cookies from "js-cookie";
import * as serialize from "form-serialize";

/*  
	Bind our cart page events
-------------------------------------------------- */
export const InitCart = ()=>{
	BindForm();
	BindRemove();
	SetupIncrements();
};

/*  
	Update cart & cart object
-------------------------------------------------- */
let lock = false;

export const CartUpdate = (callback = null)=>{
	
	let form = document.getElementById("cart-form");
	let miniCart = document.getElementById("mini-cart");
	let updateMC = true;

	// Detect when to use mini-cart
	if(!form && miniCart){
		form = document.getElementById("mini-cart-form");
		updateMC = false;
	}

	let obj = serialize(form, { hash: true, isJSON: true }); 

	obj.checkout = JSON.parse(cookies.get("chk"));

	let fixedObj = [];

	if(obj.cart){

		// Normalize the object
		Array.prototype.slice.call(obj.cart).forEach((item, key)=>{

			let varId = item.variantId;
			let quantity = item.quantity;

			let addObj = {"quantity":parseInt(quantity),"variantId":varId};

			fixedObj.push(addObj);
		});
	}

	obj.cart = fixedObj;

	// Prevent user from multiple updating
	if(lock === false){

		lock = true;

		ajax(form.method, form.action, "json", JSON.stringify(obj), (result)=>{

			let json = JSON.parse(result);

			if(json.error === "" && json.data.checkout){

				/* --- Store checkout URL --- */
				let checkoutUrl = reformatCheckoutUrl(json.data.checkout.webUrl);
				let checkoutObj = {"id":json.data.checkout.id,"url":checkoutUrl};

				cookies.set("chk", JSON.stringify(checkoutObj), { expires: 30, path: "/" });
				cookies.set("crt", JSON.stringify(json.data.checkout.lineItems.edges), { expires: 30, path: "/" });

				globalStorage.cart = json.data.checkout.lineItems.edges;
				globalStorage.checkout = checkoutObj;

				$shopify.update(checkoutObj, json.data.checkout.lineItems.edges);

				UpdateCartTotal(json.data.checkout.lineItems.edges);

				if(updateMC === true && miniCart){
					BuildMiniCart(json.data.checkout.lineItems.edges);
				}

				lock = false;

				callback(true);

			} else {
				// Error?
				console.log("error?");
			}
		});
	} else {
		console.log("too many product X in cart");
	}
};

/*  
	Cart remove button
-------------------------------------------------- */
const BindRemove = ()=>{

	// Get Remove Elements on page
	let removes = document.getElementsByClassName("cart-remove");

	Array.prototype.slice.call(removes).forEach((remove)=>{

		// Detect if bound
		if(hasClass(remove, "bound")){
			return;
		}

		remove.addEventListener("click", (event)=>{

			event.preventDefault();

			// Grab product wrapper
			let product = remove.parentElement.parentElement;

			// Maybe setup an animation?
			product.remove();

			// Update cart
			CartUpdate(()=>{
				console.log("update done");
			});
		});

		remove.classList += " bound";
	});
};

/*  
	Form event
-------------------------------------------------- */
const BindForm = ()=>{

	let forms = document.getElementsByClassName("cart-form");

	Array.prototype.slice.call(forms).forEach((form)=>{

		if(hasClass(form, "bound")){
			return;
		}

		form.addEventListener("submit", (event)=>{
			event.preventDefault();
		});
	});
};

/*  
	Update cart total
-------------------------------------------------- */
const UpdateCartTotal = (object)=>{

	let total = 0;

	if(object){

		Array.prototype.slice.call(object).forEach((item)=>{
			total += parseInt(item.node.quantity) * parseFloat(item.node.variant.price);
		});

		total = total.toLocaleString("en-US", { minimumFractionDigits: 2 });
	}

	let elems = document.getElementsByClassName("cart-total");

	Array.prototype.slice.call(elems).forEach((elem)=>{
		elem.textContent = total;
	});
};