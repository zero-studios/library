/*
 	Parse Query String to Object	
-------------------------------------------------- */
export const parseQueryString = ()=>{

	let string;

	if(location.search && location.search !== ""){

		let query  = location.search.substring(1);
		string = JSON.parse('{"' + decodeURI(query).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
	}

	return string;
};