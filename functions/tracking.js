



export class Tracking {

	constructor(type){
		this.type = type;
		this.fn = null;
	}

	/* --- Start our analytics --- */
	init(){

		/* --- Pass in our analytics object --- */
		switch(this.type){

			case "facebook":

				this.fn = (typeof fbq === "undefined") ? null : fbq;

				break;

			case "segment":

				this.fn = (typeof analytics === "undefined") ? null : analytics;

				break;

			case "google analytics":
			default:

				this.fn = (typeof ga === "undefined") ? null : ga;

				break;
		}
	}

	/* --- Track pageview --- */
	pageview(title = null, location = null){

		if(this.fn == null) return;

		switch(this.type){

			case "facebook":

				this.fn("track", "PageView");

				break;

			case "segment":

				this.fn.page();

				break;

			case "google analytics":
			default:

				this.fn("set", "page", location);
				this.fn("send", {
					hitType: "pageview",
					page: location,
					title: title
				});

				break;
		}
	}

	event(){
		
	}
}