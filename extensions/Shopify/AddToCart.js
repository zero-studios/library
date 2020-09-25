import { ajax, hasClass, parseQueryString, remove, reformatCheckoutUrl } from "../../_global/helpers";
import { globalStorage } from "../../_global/storage";
import { Shopify } from "./_init";
import { BuildMiniCart } from "./MiniCart";
import * as cookies from "js-cookie";
import * as serialize from "form-serialize";

/*
	AddToCart Class
-------------------------------------------------- */
export class AddToCart extends Shopify {

	constructor(form){

		super();

		this.form = form;
	}

	init(){

		this.id = this.form.getAttribute("data-product-id");
		this.options = this.form.getElementsByClassName("option");
		this.select = this.form.getElementsByClassName("product-select")[0];
		this.btn = this.form.querySelector("button");

		this.bindEvents();
	}

	bindEvents(){

		/* --- Bind The Form --- */
		if(!hasClass(this.form, "bound")){

			this.form.classList.add("bound");

			if(!hasClass(this.select, "hidden")){
				this.setupSelects();
			}

			this.form.addEventListener("submit", (event)=>{
				event.preventDefault();
				console.log(this);
				this.addToCart(this.form);
			});
		}

		// bindForm(this.form, false, null, (result)=>{
		// 	console.log(result);
		// });
	}

	setupSelects(){

		let options = this.options;
		let optionsArray = [];
		let variants = this.select.getElementsByTagName("option");
		let variantObj = {};
		let imagesArray = [];

		/* --- Get Labels for Variants --- */
		Array.prototype.slice.call(options).forEach((option)=>{

			let name = option.textContent.toLowerCase();

			optionsArray.push(name);
			variantObj[name] = [];
		});

		/* --- Store color outside loop --- */
		let currentColor = "";

		/* --- Get Options --- */
		Array.prototype.slice.call(variants).forEach((variant)=>{

			let setup = variant.textContent.split(" - ");
			// let price = setup[1];
			let choices = setup[0].split(" / ");

			/* --- Store Variant Images for Color Option Only --- */
			Array.prototype.slice.call(optionsArray).forEach((option, index)=>{

				if(option == "color"){

					if(currentColor !== choices[index]){

						if(globalStorage.windowWidth > 768){

							imagesArray.push(setup[2]);
						} else {
							imagesArray.push(setup[3]);
						}
					}

					currentColor = choices[index];
				}
			});

			/* --- Loop Through Variants --- */
			Array.prototype.slice.call(choices).forEach((choice, key)=>{

				if(variantObj[optionsArray[key]].indexOf(choice) === -1){
					variantObj[optionsArray[key]].push(choice);
				}
			});
		});

		/* --- Fake Select Wrapper --- */
		let fakeWrapper = this.form.querySelector(".fake-selects-wrapper");

		// let baseOption;
		let baseType;

		Object.keys(variantObj).forEach((key, i)=>{

			let setType = key.replace(/\s+/g, '-').toLowerCase();

			if(i === 0){
				baseType = key;
				// baseOption = variantObj[key][0].toLowerCase();
			}

			let div = document.createElement("div");

			div.className = "fake-select-item fake-select-item-" + setType;

			let html = "";

			if(key !== "color"){
				html += "<p class='label'>(" + key + ")</p>";
				html += "<p class='fake-selected'>" + variantObj[key][0] + "</p>";
			}

			html += "<ul class='fake-select fake-select-" + setType + "' data-type='" + setType + "'>";

			// Child loop
			Array.prototype.slice.call(variantObj[key]).forEach((selection, index)=>{

				// Format string
				let selectionText = selection.replace(/\s+/g, '-').toLowerCase();
				// Check for first child
				if(index === 0){

					if(key == "size"){

						html += "<div class='close mobile-only'><div></div><div></div></div>";
					}

					html += "<li data-name='" + selectionText + "' class='" + setType + "-" + selectionText + " selected' data-variant-img='" + imagesArray[index] + "'>" + selection + "</li>";

				} else {
					html += "<li data-name='" + selectionText + "' class='" + setType + "-" + selectionText + "' data-variant-img='" + imagesArray[index] + "'>" + selection + "</li>";
				}
			});

			html += "</ul>";

			// label appears after text
			if(key == "color"){
				html += "<p class='label'>(" + key + ")</p>";
				html += "<p class='fake-selected'>" + variantObj[key][0] + "</p>";
			}

			div.innerHTML = html;

			// Append Fake Select
			if(setType == "lens-type" || setType == "lens-options"){

				let fakeTargetted = document.getElementById("fake-" + setType);

				if(fakeTargetted){
					fakeTargetted.appendChild(div);
				} else {
					fakeWrapper.appendChild(div);
				}
			} else {
				fakeWrapper.appendChild(div);
			}
		});

		// Setup Variant Images
		// this.PDPHeroVariantImages();

		// Change Selected based on variant
		let queryString = parseQueryString();

		if(queryString && queryString.variant){
			this.setupLinkedVariant(queryString.variant);
		}

		// Get current selection
		let selected = this.getCurrentSelection();

		// Check Sold out State
		this.checkSoldOut(this.form, variants, selected);

		// Needs to be run in order to hide relative variants according to first written variant dropdown
		let array = this.returnAvailableVariants(variants, selected, optionsArray);

		// Hide variants
		this.hideVariants(array, baseType);

		// Bind Select Events
		let fakeSelects = this.form.getElementsByClassName("fake-select-item");

		Array.prototype.slice.call(fakeSelects).forEach((elem)=>{
			this.bindSelects(variants, elem);
		});
	}

	bindSelects(variants, select){

		// let fakeSelects = this.form.getElementsByClassName("fake-select");
		let options = select.getElementsByTagName("li");

		// Loop Through LI's
		Array.prototype.slice.call(options).forEach((elem)=>{

			let option = elem.getAttribute("data-name");
			let parent = elem.parentElement;
			let type   = parent.getAttribute("data-type");
			let label  = parent.parentElement.querySelector(".fake-selected");

			// Bind Click
			elem.addEventListener("click", ()=>{

				// Check if Element is already selected
				if(!hasClass(elem, "selected")){

					// Set Selected
					Array.prototype.slice.call(options).forEach((li)=>{

						if(li == elem){
							li.className += " selected";
							// Change selected Text
							label.textContent = li.textContent;
						} else {
							li.classList.remove("selected");
						}
					});

					// Get current selection
					let selected = this.getCurrentSelection();

					// Check Sold out State
					this.checkSoldOut(this.form, variants, selected);

					// Check what's available based on selection
					let storedVar = this.returnAvailableVariants(variants, option);

					// Hide variants
					this.hideVariants(storedVar, type);

					// Selected Index
					let select  = this.form.querySelector(".product-select");
					let selectOptions = select.getElementsByTagName("option");
					let selectIndex;

					// Loop to get Selected Index
					Array.prototype.slice.call(selectOptions).forEach((option, index)=>{

						let splitText = option.textContent.split(" - ");
						let optionText = splitText[0].toLowerCase();

						// Always compare by transforming "-" -> " " instead of other way around since variants can have both "-" and " "
						if(optionText == selected.replace(/-/g, " ")){

							selectIndex = index;
						}
					});

					// Set Index
					select.selectedIndex = selectIndex;

					// Other Bindings
				}
			});
		});
	}

	setupLinkedVariant(id){

		let select = this.form.querySelector(".product-select");
		let selectOptions = select.getElementsByTagName("option");
		let selectedIndex = 0;

		// Loop to get Selected Index
		Array.prototype.slice.call(selectOptions).forEach((option, index)=>{

			// let variantId = option.value;
			let variantId = option.getAttribute("data-raw-id");

			// Is variant
			if(variantId == id){
				selectedIndex = index;
			}
		});

		// Set Index
		select.selectedIndex = selectedIndex;

		// Set default selections
		let selection = selectOptions[selectedIndex].textContent;
		let selectionFilter = selection.split(" - "); // Get variant selections
			selectionFilter = selectionFilter[0].split(" / "); // make array
		let fakeSelects = this.form.getElementsByClassName("fake-select-item");
		let storedColor = null; // Store color for variant selection
		let storedElem = null;
		let storedIndex = null;
		let selectedElem = null;
		let selectedColor = null;
		let selectedImage = null;

		// Loop through fake selects
		Array.prototype.slice.call(fakeSelects).forEach((elem, key)=>{

			let fakeSelect = elem.querySelector(".fake-select");
			let fakeSelectType = fakeSelect.getAttribute("data-type");
			let fakeOptions = elem.getElementsByTagName("li");
			let checkOption = this.options[key].textContent.toLowerCase();

			// Flag stored color
			if(checkOption == "color"){
				storedElem = elem.querySelector(".selected");
				storedColor = storedElem.getAttribute("data-name");
			}

			if(fakeOptions.length > 1){

				Array.prototype.slice.call(fakeOptions).forEach((option, index)=>{

					// Always compare by transforming "-" -> " " instead of other way around since variants can have both "-" and " "
					let value = option.getAttribute("data-name").replace(/-/g, " ");
					let compare = selectionFilter[key].toLowerCase();

					// Check if Types are the same, and then values, then select that option
					if(fakeSelectType == checkOption && value == compare && !hasClass(option, "selected")){

						// add selected
						option.className += " selected";

						// set storedIndex for color
						if(checkOption == "color"){
							storedIndex = index;
							selectedImage = option.getAttribute("data-variant-img");
						}

					} else if(value !== compare){
						// remove selected
						option.classList.remove("selected");
					}
				});
			}

			// Get new color
			if(checkOption == "color"){
				selectedElem = elem.querySelector(".selected");
				selectedColor = selectedElem.getAttribute("data-name");
			}

			// set Text
			let text = elem.querySelector(".fake-selected");

			text.textContent = selectionFilter[key];
		});

		// Change color variant if new color is selected
		if(storedElem !== null && storedColor !== selectedColor){

			let pdpImagesContainer = document.getElementById("variant-images-container");
			let image = pdpImagesContainer.children[storedIndex];

			// Setup image without Mouseover
			image.style.backgroundImage = `url(${selectedImage})`;

			// hide other image
			Array.prototype.slice.call(pdpImagesContainer.children).forEach((elem)=>{
				// TweenMax.set(elem, {autoAlpha: 0});
			});

			// show active image
			// TweenMax.set(image, {autoAlpha: 1});
		}
	}

	returnAvailableVariants(variants, option, optionsArray = null){

		// Get Available Variant Types for other Variants
		let array = [];
		let currentSelected = option;

		if(currentSelected.indexOf(" / ") > -1){
			currentSelected = currentSelected.split(" / ");
			currentSelected = currentSelected[0];
		}

		Array.prototype.slice.call(variants).forEach((variant)=>{

			// Set Text string
			let string = variant.textContent.toLowerCase().split(" - ");
				string = string[0].split(" / ");

			if(string.indexOf(currentSelected) > -1){

				let stringArray = remove(string, currentSelected);

				array = array.concat(stringArray);
			}
		});

		return array;
	}

	checkSoldOut(form, variants, option){

		// Get Available Variant Types for other Variants
		let soldOut = true;
		let productPriceElems = document.getElementsByClassName("product-price");
		let quantity = form.querySelector("[name='quantity']").value;

		Array.prototype.slice.call(variants).forEach((variant)=>{
			// Set Text string
			let string = variant.textContent.toLowerCase().split(" - ");
			let price = string[1];

			string = string[0];

			// Data inventory
			let inventory = parseInt(variant.getAttribute("data-inventory"));

			// Always compare by transforming "-" -> " " instead of other way around since variants can have both "-" and " "
			if(string.replace(/-/g, " ").indexOf(option.replace(/-/g, " ")) > -1){

				Array.prototype.slice.call(productPriceElems).forEach((priceElem)=>{
					priceElem.setAttribute("data-usd", price);
					priceElem.textContent = "$" + ((price).toLocaleString("en-US", { minimumFractionDigits: 2 }) * quantity);
				});

				if(inventory > 0){
					soldOut = false;
				}
			}
		});

		if(soldOut === true){
			// Sold out state
			if(!hasClass(this.btn, "disabled")){
				this.btn.className += " disabled";
			}
			this.btn.textContent = "Sold Out";
		} else {
			// Default state
			this.btn.classList.remove("disabled");
			this.btn.textContent = "Add To Bag";
		}

		// return soldOut;
	}

	getCurrentSelection(){

		let selectionString = "";
		let selected = document.querySelectorAll(".fake-select .selected");

		Array.prototype.slice.call(selected).forEach((item, key)=>{
			if(key === 0){
				selectionString += item.getAttribute("data-name");
			} else {
				selectionString += " / " + item.getAttribute("data-name");
			}
		});

		return selectionString;
	}

	hideVariants(array, type){

		let fakeSelects = this.form.getElementsByClassName("fake-select");

		// Update Other Fake Selects
		Array.prototype.slice.call(fakeSelects).forEach((select)=>{

			let dataType = select.getAttribute("data-type");

			if(dataType !== type){

				// Check if child value is in array
				let children = select.getElementsByTagName("li");

				Array.prototype.slice.call(children).forEach((child)=>{

					if(array.indexOf(child.textContent.toLowerCase()) > -1){
						// show element
						child.classList.remove("disabled");
					} else {
						// hide element
						child.className += " disabled";
					}
				});
			}
		});
	}

	addToCart(){

		let obj = serialize(this.form, { hash: true, isJSON: true });
		let miniCart = document.getElementById("mini-cart");

		obj.checkout = globalStorage.checkout;

		let lock = false;
		let productObj;
		let crt = globalStorage.cart;

		// Scan cart for items
		if(crt !== undefined && crt.length > 0){
			productObj = this.addItem(crt, obj);
		} else {

			/* --- Grab our line item props --- */
			if(obj.properties){

				let customAttributes = [];

				Object.keys(obj.properties).forEach((key, i)=>{

					let propObj = {
						"key": key,
						"value": obj.properties[key]
					};

					customAttributes.push(propObj);
				});

				productObj = [{ "quantity": parseInt(obj.quantity), "variantId": obj.id, "customAttributes": customAttributes }];
			} else {
				productObj = [{ "quantity": parseInt(obj.quantity), "variantId": obj.id }];
			}
		}

		obj.cart = productObj;

		// Prevent user from adding more than X of one item to cart
		if(lock === false){
			ajax(this.form.method, this.form.action, "json", JSON.stringify(obj), (result)=>{

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

					if(miniCart){
						BuildMiniCart(json.data.checkout.lineItems.edges);
					}

				} else {
					// Error?
					console.log("error?");
				}
			});
		} else {
			console.log("too many product X in cart");
		}
	}

	addItem(cart, obj){

		let inCart = false;
		let curId = obj.id;
		let checkoutObj = [];

		Array.prototype.slice.call(cart).forEach((item, key)=>{

			let varId = item.node.variant.id;
			let quantity = item.node.quantity;

			if(varId == curId){
				quantity = quantity + parseInt(obj.quantity);
				inCart = true;
			}

			let addObj = {"quantity":parseInt(quantity),"variantId":varId};

			checkoutObj.push(addObj);
		});

		if(inCart === false){

			let newObj;

			if(obj.properties){

				let newCustomAttributes = [];

				Object.keys(obj.properties).forEach((key, i)=>{

					let propObj = {
						"key": key,
						"value": obj.properties[key]
					};

					newCustomAttributes.push(propObj);
				});

				newObj = {"quantity":parseInt(obj.quantity),"variantId":obj.id,"customAttributes":newCustomAttributes};
			} else {
				newObj = {"quantity":parseInt(obj.quantity),"variantId":obj.id};
			}

			checkoutObj.push(newObj);
		}

		return checkoutObj;
	}
}