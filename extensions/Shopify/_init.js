import * as cookies from "js-cookie";
import { BuildMiniCart } from "./MiniCart";
/*
	Shopify Class
-------------------------------------------------- */
export class Shopify {

	constructor(){
		this.checkout = (cookies.get("chk")) ? JSON.parse(cookies.get("chk")) : undefined;
		this.cart = (cookies.get("crt")) ? JSON.parse(cookies.get("crt")) : {};
	}

	init(){
		BuildMiniCart(this.cart);
	}

	update(checkout, cart){
		this.checkout = checkout;
		this.cart = cart;
	}
}