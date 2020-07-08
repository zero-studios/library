/*
 	Vanilla .eq()
	
	Returns element by index.

	Usage: eq.call(arrayOfElements, index);
-------------------------------------------------- */
export const eq = (index)=>{
	if(index >= 0 && index < this.length){
		return this[index];
	} else {
		return -1;
    }
};