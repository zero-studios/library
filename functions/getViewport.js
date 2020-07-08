/* 	
	getViewport
	- returns the native height and width of the browser viewport.
-------------------------------------------------- */
export const getViewport = function(){

	let e = window, a = "inner";

	if(!("innerWidth" in window)){
		a = "client";
		e = document.documentElement || document.body;
	}

	return { width: e[ a + "Width" ], height: e[ a + "Height" ] };
};