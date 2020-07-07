import { hasClass } from "../../_global/helpers";
import { CartUpdate } from "./Cart";

/*  
	Setup cart increments

	Plus - add item to cart, up to cap
	Minus - subtract item from cart, remove at 0

	Increment HTML:

	<div class="increment-wrapper">
		<span class="increment" data-type="minus">-</span>
		<span class="count">1</span>
		<span class="increment" data-type="plus">+</span>
	</div>

	This also assumes use within add-to-cart forms that the
	immediate parent element is the <form> tag. Otherwise the
	immediate parent should be a product identifier, 
	e.g:

-------------------------------------------------- */
let lock = false;

export const SetupIncrements = ()=>{

	let productCap = 5;
	let increments = document.getElementsByClassName("increment");

	// Loop through triggers
	Array.prototype.slice.call(increments).forEach((elem)=>{

		// Only bind once
		if(hasClass(elem, "bound")){
			return;
		}

		// Settings
		let type = elem.getAttribute("data-type");
		let parent = elem.parentElement; 
		let product = parent.parentElement;
		let plus = parent.querySelector("[data-type='plus']");
		let minus = parent.querySelector("[data-type='minus']");

		// If you want to use an external or global targeted product
		if(elem.getAttribute("data-product-selector")){
			product = document.querySelector(elem.getAttribute("data-product-selector"));
		}

		let count = parent.querySelector(".count");
		let update = false; // Determine if updating cart object 
		let number;
		let input;

		// Bind click
		elem.addEventListener("click", (event)=>{

			event.preventDefault();

			if(lock === true){
				return;
			}

			let newNumber;

			// Increment
			if(product.tagName == "FORM"){

				input = product.querySelector("[name='quantity']");
				number = parseInt(input.value);

			// Increment inside mini-cart / cart
			} else {

				input = product.querySelector("[type='number']");
				number = parseInt(count.textContent);
				update = true;
			}

			if(!hasClass(elem, "disabled")){
				
				lock = true;

				switch(type){
					case "plus":

						minus.classList.remove("disabled");
						newNumber = number + 1;

						// Disable button if product cap is hit
						if(newNumber == productCap){
							elem.className += " disabled";
						}

						break;

					case "minus":

						plus.classList.remove("disabled");
						newNumber = number - 1;

						// If new number is 0, remove from cart
						if(newNumber === 0 && update === true){
							// delete product line
							product.remove();

						// If new number is 1, stop increment
						} else if(newNumber == 1 && update === false){
							elem.className += " disabled";
						}

						break;

					default:

						break;
				}

				// Update visible count
				count.textContent = newNumber;

				// Update form quantity
				input.value = newNumber;
				input.setAttribute("value", newNumber);
				product.setAttribute("data-quantity", newNumber);

				// Update any product price display
				let productPrice = product.querySelector(".product-price");
				let productTotal = product.querySelector(".product-total");

				if(productTotal && productPrice){
					productPrice = productPrice.textContent;
					productPrice = parseFloat(productPrice.replace(/[^0-9.,]+/, ""));
					productTotal.textContent = "$" + (productPrice * newNumber).toLocaleString("en-US", { minimumFractionDigits: 2 });
				}

				if(update === true){
					CartUpdate(()=>{
						lock = false;
					});
				} else {
					lock = false;
				}
			}
		});

		elem.className += " bound";
	});
};