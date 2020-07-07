/*  
    ajax
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

export const ajax = (url, options, callback = null)=>{

    this.url = url;
    this.method = (typeof options.method === "undefined") ? "get" : options.method;
    this.type = (typeof options.type === "undefined") ? "json" : options.type.toLowerCase();
    this.headers = (typeof options.headers === "undefined") ? [] : options.headers;
    this.data = (typeof options.data === "undefined") ? null : options.data;

    /* --- Start our XHR connection --- */
    let xhr = new XMLHttpRequest();

    xhr.open(this.method, this.url, true);

    /* --- Add our Headers --- */
    if(this.type === "json"){
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");
    }

    Array.prototype.slice.call(this.headers).forEach((header)=>{
        xhr.setRequestHeader(header[0], header[1]);
    });

    /* --- Send our request --- */
    xhr.send(data);

    /* --- Let's check our state change --- */
    xhr.onreadystatechange = ()=>{

        if(xhr.readyState === 4 && xhr.status === 200){

            if(this.type === "text"){
                callback(xhr.responseText);
            } else {
                callback(xhr.response);
            }
        }
    };
};