/*  
    ajax -- CONVERT TO CLASS EVENTUALLY?
	- ajax Request with Callback
    - makes an ajax call

    usage (with defaults):

    ajax("https://google.com/", {
        method: "get", // "get", "post", "put"
        type: "json", // "json", "text", "blob", "document", "arraybuffer"
        headers: [ // nested array of headers
            ["Content-type", "text/plain"]
        ],
        data: data // can be type "object" or "string"
    }, (callback)=>{
        
    });

    To-Do:
    - setup method "put"
    - setup types "blob", "arraybuffer"
-------------------------------------------------- */
export const ajax = (url, options = {}, callback = null)=>{

    let method = (typeof options.method === "undefined") ? "get" : options.method;
    let type = (typeof options.type === "undefined") ? "json" : options.type.toLowerCase();
    let headers = (typeof options.headers === "undefined") ? [] : options.headers;
    let data = (typeof options.data === "undefined") ? null : options.data;

    /* --- Start our XHR connection --- */
    let xhr = new XMLHttpRequest();

    xhr.open(method, url, true);

    /* --- Add our Headers --- */
    if(type === "json"){
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    Array.prototype.slice.call(headers).forEach((header)=>{
        xhr.setRequestHeader(header[0], header[1]);
    });

    /* --- Send our request --- */
    xhr.send(data);

    /* --- Let's check our state change --- */
    xhr.onreadystatechange = ()=>{

        if(xhr.readyState === 4 && xhr.status === 200){

            if(type === "text"){
                callback(xhr.responseText);
            } else {
                callback(xhr.response);
            }
        }
    };
};