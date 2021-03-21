import { remove } from "../functions/remove";
/*
 * Worker pool initialization file
 *
 *	- Sets up our worker pool to give our
 *	  javaScript an array of worker threads
 *	  to work with
 *	- Workers are used to run long-running
 *	  or heavy scripts, don't inject every
 *	  function into this.
 */
export class LazyLoadWorker {

	constructor(worker, options = {}){

		this.array = [];
		this.count = 0; // How many images have finished their lazyload
		this.sent = 0; // How many images have been sent to lazyload
		this.total = 0; // Count of images requested to lazyload

		/* --- Grab our options --- */
		this.callbackCap = (typeof options.callbackCap === "undefined") ? 1000000 : parseInt(options.callbackCap); // Max Images to load before firing callback
		this.dataAttr = (typeof options.dataAttr === "undefined") ? "preload" : options.dataAttr; // What data attribute to use
		this.forceNoWorker = (typeof options.forceNoWorker === "undefined") ? false : options.forceNoWorker; // Force lazy load to not use the worker
		this.size = (typeof options.size === "undefined") ? "mobile" : options.size; // Data attribute size, data-preload-{size}
		this.tagExclusions = (typeof options.tagExclusions === "undefined") ? ["audio", "iframe", "video"] : options.tagExclusions; // Which html tags to exclude from worker load
		this.workerCap = (typeof options.workerCap === "undefined") ? 1000000 : parseInt(options.workerCap); // How many images to blob before moving back to traditional load
		this.delay = (typeof options.delay === "undefined") ? false : parseInt(options.delay); // Time in milleseconds to force load

		/* --- Only assign worker if not forced off --- */
		this.worker = (this.forceNoWorker === true) ? null : new Worker(worker);

		/* --- Bind our worker events --- */
		this.bindEvents();
	}

	bindEvents(){

		/* --- Setup our listener for the worker --- */
		if(this.worker){

			this.worker.addEventListener("message", (event)=>{

				const data = event.data;
				let url = URL.createObjectURL(data.blob);

				/* --- Let's update our array key --- */
				this.array[data.url] = url;

				/* --- Make sure we get elements that might have duplicate images --- */
				let images = document.querySelectorAll(`[data-${this.dataAttr}-${this.size}="${data.url}"]:not(.loaded)`);

				for(let i = 0; i < images.length; i++){
					this.preload(images[i], url);
				}
			});
		}
	}

	/* --- Load a single image --- */
	loadImage(element){

		let url = element.getAttribute(`data-${this.dataAttr}-${this.size}`);

		if(this.array[url] !== undefined && this.array[url] !== ""){
			this.preload(element, this.array[url]);
		}
	}

	/* --- Load images off url --- */
	loadUrl(){}

	/* --- Load an array of images --- */
	loadImages(images = [], size, callback){

		/* --- Check against selector instead of array --- */
		if(typeof images === "string") images = document.querySelectorAll(images + ":not(.loaded)");

		let protocol = window.location.protocol + "//";

		this.count = 0;
		this.total = images.length;
		this.size = (size && size !== this.size) ? size : this.size;

		/* --- Loop through our images --- */
		for(let i = 0; i < images.length; i++){

			let url = images[i].getAttribute(`data-${this.dataAttr}-${this.size}`);
			let tag = images[i].tagName.toLowerCase();

			/* --- Blank URLs should be passed --- */
			if(!url || url === ""){

				this.clearElement(images[i]);
				this.total--;

				continue;
			}

			/* --- Fallback for localhost images --- */
			if(url.indexOf("http") < 0) url = protocol + window.location.host + url;

			/* --- Duplicates should be passed, but not subtracted --- */
			if(this.array[url] !== undefined && this.array[url] === "") continue;

			/* --- Hey, we've loaded this image previously... load then skip --- */
			if(this.array[url] !== undefined && this.array[url] !== ""){

				this.preload(images[i], this.array[url]);
				this.total--;

				continue;
			}

			/* --- Don't send the URL to the worker --- */
			if(this.forceNoWorker === true || this.tagExclusions.indexOf(tag) >= 0 || this.sent >= this.workerCap){

				/* --- Traditional non-worker Load --- */
				this.preload(images[i], url);

				continue;
			}

			/* --- Send the url over to the worker --- */
			this.array[url] = "";
			this.sent++;
			this.message(url);
		}

		/* --- Set our callback interval --- */
		let timeout = setTimeout(()=>{});
		let interval = setInterval(()=>{

			if(this.count >= this.total || this.count >= this.callbackCap){
				clearTimeout(timeout);
				clearInterval(interval);
				callback(this.count + " elements loaded, " + (this.count - this.total) + " duplicate elements, " + (images.length - this.total) + " deferred elements");
			}

		}, 10);

		if(this.delay && this.delay !== false){

			timeout = setTimeout(()=>{
				clearInterval(interval);
				callback(this.count + " elements loaded, forced after " + this.delay + " milleseconds");
			}, this.delay);
		}
	}

	/* --- Detect tag and load accordingly --- */
	preload(element, url){

		let tag = element.tagName.toLowerCase();

		switch(tag){

			/* --- Source --- */
			case "audio":
			case "video":

				this.loadSource(element, url);

				break;

			/* --- SVG Image Tags --- */
			case "image":

				this.loadSVGImage(element, url);

				break;

			/* --- Src --- */
			case "iframe":
			case "img":

				this.loadSrc(element, url);

				break;
				
			/* --- Background-image --- */
			default:

				this.loadBackgroundImage(element, url);

				break;
		}

		this.clearElement(element);
	}

	/* --- Load url into child source element --- */
	loadSource(element, url){

		let source = document.createElement("source");

		source.setAttribute("src", url);

		element.appendChild(source);
		element.load();
		element.play();

		let checkVideoLoad = setInterval(()=>{

			if(element.readyState > 3){

				/* --- Video has loaded --- */
				element.className += " loaded";

				this.count++;

				clearInterval(checkVideoLoad);
			}

		}, 10);
	}

	/* --- Load url into src attribute --- */
	loadSrc(element, url){

		element.onload = ()=>{

			/* --- Add preload class --- */
			element.className += " loaded";

			this.count++;
		};

		element.onerror = ()=>{
			this.count++;
		};

		element.setAttribute("src", url);
	}

	loadSVGImage(element, url){

		element.onload = ()=>{

			element.className += " loaded";

			this.count++;
		};

		element.onerror = ()=>{
			this.count++;
		};

		element.setAttribute("href", url);
	}

	/* --- Load url into background-image --- */
	loadBackgroundImage(element, url){

		let image = new Image();

		image.onload = ()=>{
			element.style.backgroundImage = "url(" + url + ")";
			element.className += " loaded";
			this.count++;
		};

		image.onerror = ()=>{
			this.count++;
		};

		image.src = url;
	}

	/* --- Remove selectors and urls --- */
	clearElement(element){
		element.removeAttribute(`data-${this.dataAttr}-${this.size}`);
	}

	clearBlob(url){

		if(!this.array[url]) return;

		URL.revokeObjectURL(this.array[url]);

		remove(this.array, url);
	}

	/* --- Remove all blobs from memory --- */
	clearAllBlobs(){

		for(let i = 0; i < this.array.length; i++){
			URL.revokeObjectURL(this.array[i]);
		}

		this.array = [];
	}

	/* --- Post our message to the worker --- */
	message(message){
		this.worker.postMessage(message);
	}
}