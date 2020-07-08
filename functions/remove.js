/*
 	Vanilla JS array remove
-------------------------------------------------- */
export const remove = (array, key)=>{
	return array.filter(e => e !== key);
};