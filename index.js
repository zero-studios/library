/* --- Functions --- */
import { ajax } from "./functions/ajax";
import { eq } from "./functions/eq";
import { getViewport } from "./functions/getViewport";
import { hasClass } from "./functions/hasClass";
import { parseQueryString } from "./functions/parseQueryString";
import { remove } from "./functions/remove";

export {
	ajax,
	eq,
	getViewport,
	hasClass,
	parseQueryString,
	remove
}

/* --- Extensions --- */
// import { Shopify } from "./extensions/Shopify/_init";

// export {
// 	Shopify
// };

/* --- Classes --- */
import { LazyLoadWorker } from "./classes/LazyLoadWorker";

export {
	LazyLoadWorker
}