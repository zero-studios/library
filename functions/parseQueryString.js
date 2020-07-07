/*
	parseQueryString
 	- parse search parameters to JSON Object
-------------------------------------------------- */
export const parseQueryString = ()=>{

	/* --- Return if there is no search string --- */
	if(!window.location.search || window.location.search == "") return;

	/* --- Parse the search parameters to a JSON object --- */
	return JSON.parse('{"' + decodeURI(window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
};