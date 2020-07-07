/*
 	hasClass
	- returns true/false if element has classname.
-------------------------------------------------- */
export const hasClass = (element, cls)=>{
    return (" " + element.className + " ").indexOf(" " + cls + " ") > -1;
};