var addNote = function(title, urls, auth, responsesTextsProcessingFunction) {
	let args = {};
	if(responsesTextsProcessingFunction) {
		args.title = title;
		args.urls = Array.isArray(urls) ? urls : [urls];
		args.auth = auth;
		args.responsesTextsProcessingFunction = responsesTextsProcessingFunction;
	}
	else if (auth) {
		args.title = title;
		args.urls = Array.isArray(urls) ? urls : [urls];
		args.auth = auth;
		args.responsesTextsProcessingFunction 
			= responsesTextsProcessingFunction || function (responsesTexts, contentDiv) { contentDiv.innerHTML = "<pre>" + (Array.isArray(responsesTexts) ? responsesTexts.map(x => JSON.stringify(JSON.parse(x), null, 2)).join("\n") : JSON.stringify(JSON.parse(responsesTexts), null, 2)) + "</pre>"; };
	}
	else if (urls) {
		args.title = title;
		if (typeof urls == "string")
			args.htmlString = urls;
		else if (typeof urls == "function")
			args.jsFunction = urls;
		else
			args.urls = Array.isArray(urls) ? urls : [urls];
	}
	else {
		args.title = title || "What's the title ?";
	}
	
	return _addNote(args);
}

var _addNote = function(args) {
	let isFirstTime = !document.getElementById("toc");
	
	if(isFirstTime) {
		window.htmlOriginalScaffoldingString = document.documentElement.outerHTML;
		UTILS.createDomScaffolding();
	}
	// Add to toc
	var tocElement = document.createElement("p");	
	document.getElementById("toc").appendChild(tocElement);
		tocElement.id = args.title;
		tocElement.classList.add("tocElement")
		tocElement.textContent = args.title;
		
		tocElement.addEventListener("click", function() {
			if (this.classList.contains("selected"))
				return;

			// Remove current selection
			var selectedTocElements = document.getElementsByClassName("selected");
			var nbSelectedTocElements = selectedTocElements.length;
			for(let i = 0; i < nbSelectedTocElements; i++)
				selectedTocElements[i].classList.remove("selected");
			
			// Set new selection	
			this.classList.add("selected");
			let contentDiv = document.getElementById("content");
			
			contentDiv.innerHTML = "";
			
			if (args.htmlString)
				contentDiv.innerHTML = args.htmlString;
			else if (args.jsFunction) {
				let func = args.jsFunction;
				func(contentDiv);
			}
			else {
				let xhrResponsesTexts = [],
					nbUrls = args.urls.length;
				for(var i = 0; i < nbUrls; i++)
					xhrResponsesTexts.push(null);
				
				let auth64 = null;
				if (args.auth)
					auth64 = btoa(unescape(encodeURIComponent(args.auth)));
				
				for(let i = 0; i< nbUrls; i++)
				{
					let url = args.urls[i];
						url += ((url.indexOf("?") == -1 ? "?" : "&") + new Date().getTime());
						if (!args.auth)
							url = "https://cors-anywhere.herokuapp.com/" + url;
					
					var xhr = new XMLHttpRequest();
					xhr.open("GET", url);
					xhr.setRequestHeader("cache-control", "no-cache");
					if (args.auth) {
						contentDiv.innerHTML = "<b>Note:</b><br/>Sensitive authentication IDs are used here.<br/>Please use a web browser plugin that disables the <a href='https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors'>Cross-Origin Resource Sharing (CORS)</a> restrictions for this page (I use CORS Everywhere)";
						xhr.withCredentials = true;
						xhr.setRequestHeader("Authorization", "Basic " + auth64);
					}
					
					xhr.addEventListener("readystatechange", function () {
						if (this.readyState === 4) {
							xhrResponsesTexts[i] = this.responseText;
							
							let receivedResponsesFromAllURLs = (xhrResponsesTexts.indexOf(null) == -1);
							if (receivedResponsesFromAllURLs)
								if (nbUrls == 1)
									if (xhrResponsesTexts[0] == "")
										return;
									else
										args.responsesTextsProcessingFunction(xhrResponsesTexts[0], contentDiv);
								else
									args.responsesTextsProcessingFunction((nbUrls == 1) ? xhrResponsesTexts[0] : xhrResponsesTexts, contentDiv);
						}
					});
					
					xhr.send(null);
				}
			}
		});

	if(!window.firstCallToAddContent) {
		tocElement.click();
		window.firstCallToAddContent = 1;
	}
};

var UTILS = {
	HTMLize: (str) => str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>').replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/ /g, '&nbsp;'),
	getOrdinalDayOfMonth: (n) =>  n + (n > 0 ? ['th', 'st', 'nd', 'rd'][(n > 3 && n < 21) || n % 10 > 3 ? 0 : n % 10] : ''),
	days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
	months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
	nbMsPerDay: 1000 * 60 * 60 * 24,
	parseISOString: function(stringISO) {
		var b = stringISO.split(/\D+/);
		if (b.length >= 7)
			return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
		else if (b.length == 6)
			return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5]));
		else if (b.length == 5)
			return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4]));
		else if (b.length == 4)
			return new Date(Date.UTC(b[0], --b[1], b[2], b[3]));
		else if (b.length == 3)
			return new Date(Date.UTC(b[0], --b[1], b[2]));
		else throw "string " + stringISO + " is not a date";
	},
	removeDuplicates(myArr, prop) {
		return myArr.filter((obj, pos, arr) => {
			return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
		})
	},
	createDomScaffolding: function() {
		document.body = document.createElement("body");
		
		let titleAndTocDiv = document.createElement("div");
			titleAndTocDiv.id = "titleAndToc";
			
			let pageTitleContainer = document.createElement("div");
				pageTitleContainer.id = "pageTitleContainer";
				
				let linkToOnlineDemo = document.createElement("a");
					linkToOnlineDemo.href = "https://melandel.github.io/notes/demo.html";
					linkToOnlineDemo.target = "_blank";
					linkToOnlineDemo.textContent = "Notes"
				pageTitleContainer.appendChild(linkToOnlineDemo);
				
				pageTitleContainer.appendChild(document.createTextNode(" about:"));
				pageTitleContainer.appendChild(document.createElement("br"));
				
				let pageTitle = document.createElement("div");
					pageTitle.id = "pageTitle";
					pageTitle.textContent = document.head.getElementsByTagName("title")[0].textContent;
				pageTitleContainer.appendChild(pageTitle);
			titleAndTocDiv.appendChild(pageTitleContainer);
			
			let tocDiv = document.createElement("div");
				tocDiv.id = "toc";
			titleAndTocDiv.appendChild(tocDiv);
		document.body.appendChild(titleAndTocDiv);
		
		let sepDiv = document.createElement("div");
			sepDiv.id = "sep";
		document.body.appendChild(sepDiv);
			
		let contentDiv = document.createElement("div");
			contentDiv.id = "content";
		document.body.appendChild(contentDiv);
		
		var style = document.head.appendChild(document.createElement('style'));
			style.sheet.insertRule("body { background: #92dce5; overflow-y: hidden; }");
			style.sheet.insertRule("#titleAndToc { float: left; width: 18%; height: 100%; overflow: hidden; color: #4d6066;}");
			style.sheet.insertRule("#pageTitleContainer { padding: 10px; background: blanchedalmond; border: 4px solid brown; margin-bottom: 10px; color: black; max-height: 20%}");
			style.sheet.insertRule("#pageTitle { font-family: Impact; font-size: 20px; text-align: center; color: cadetblue; white-space: pre-wrap; word-wrap: break-word; }");
			style.sheet.insertRule("#toc { background: #c6dea6;overflow-y: auto; color: #4d6066; height:calc(100vh - 78px); overflow-y: auto; }");
			style.sheet.insertRule(".tocElement { cursor: pointer;padding-left: 10px;margin:3px; font-family: Impact; }");
			style.sheet.insertRule(".selected { background: #ebebeb; color: #856514;}");
			style.sheet.insertRule('#content { background: beige;float: left;width: calc(100vw - 18vw - 30px);padding-bottom: 10px; height: calc(100vh - 26px); overflow-y: auto; font-family: "PT Sans",Arial,sans-serif; }');
			style.sheet.insertRule("#sep { width: 5px; float: left; height: 100%; margin-right: 2px; border-left: 2px; cursor: pointer; }");
			style.sheet.insertRule("pre { overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }");
		// Not required but nicer for exports
		style.innerHTML = Array.from(style.sheet.rules).map(x => x.cssText).join("\n");
		
		window.addEventListener("keydown", function(event) {
			let isCtrlA = (event.keyCode == 65 && event.ctrlKey);
			if (!isCtrlA)
				return true;
			
			event.preventDefault();
			
			let elementToSelect = contentDiv;
			let ctrlAElements = contentDiv.getElementsByClassName("ctrlA");
			if (ctrlAElements.length > 0)
				elementToSelect = ctrlAElements[0];
			
			var range = document.createRange();
			range.selectNode(elementToSelect);
			window.getSelection().removeAllRanges();
			window.getSelection().addRange(range);
		
			return false;
		});
		
		window.contentDivOriginalWidth = window.getComputedStyle(contentDiv).getPropertyValue("width");
		window.sepDivOriginalWidth = window.getComputedStyle(sepDiv).getPropertyValue("width");
		window.sepDivAlternativeWidth = `${parseInt(window.sepDivOriginalWidth) + 5}px`;
		sepDiv.addEventListener("click", function() {
			if (titleAndTocDiv.style.display == "none") {
				titleAndTocDiv.style.display = "block";
				contentDiv.style.width = window.contentDivOriginalWidth;
				sepDiv.style.width = window.sepDivOriginalWidth;
				sepDiv.style.background = null;
			}
			else {
				titleAndTocDiv.style.display = "none";
				if (!window.contentDivExpandedWidth) {
					contentDiv.style.width = "calc(100vw - 28px - 5px)";
					window.contentDivExpandedWidth = window.getComputedStyle(contentDiv).getPropertyValue("width");
				}
				else {
					contentDiv.style.width = window.contentDivExpandedWidth;
				}
				sepDiv.style.width = window.sepDivAlternativeWidth;
				sepDiv.style.background = "brown";
			}
		});
	},
	init: function() {
		Date.prototype.toString = function() {
			return `${UTILS.days[this.getDay()]} ${UTILS.getOrdinalDayOfMonth(this.getDate())} of ${UTILS.months[this.getMonth()]} - ${String(this.getHours()).padStart(2, "0")}:${String(this.getMinutes()).padStart(2, "0")}`;
		};
		
		Date.prototype.toString2 = function() {
			return `${UTILS.days[this.getDay()]} ${UTILS.getOrdinalDayOfMonth(this.getDate())} of ${UTILS.months[this.getMonth()]} ${this.getFullYear()} - ${String(this.getHours()).padStart(2, "0")}:${String(this.getMinutes()).padStart(2, "0")}`;
		};
		
		Date.prototype.toShortDateString = function() {
			return `${this.getFullYear()}/${String(this.getMonth() + 1).padStart(2, "0")}/${String(this.getDate()).padStart(2, "0")}`;
		};

		Date.prototype.diffInDays = function(date) {
		  // Discard the time and time-zone information.
		  const utc1 = Date.UTC(this.getFullYear(), this.getMonth(), this.getDate());
		  const utc2 = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

		  return Math.floor((utc2 - utc1) / UTILS.nbMsPerDay);
		};
		
		Date.prototype.diffFromNowString = function() {
			let dateFromNowInMonthsAndDays = "";
			let now = new Date(Date.now());
			
			let timeFromNowInDays = Math.abs(now.diffInDays(this));
			if (timeFromNowInDays == 0) {
				dateFromNowInMonthsAndDays = "today";
			}
			else if (timeFromNowInDays == 1) {
				dateFromNowInMonthsAndDays = "yesterday";
			}
			else {
				if (timeFromNowInDays <= 30) {
					let nbDaysLeft = timeFromNowInDays % 30;
					dateFromNowInMonthsAndDays += `${nbDaysLeft} days`;
				}
				else {
					let nbMonths =  Math.floor(timeFromNowInDays / 30);
					let nbDaysLeft = timeFromNowInDays % 30;
					dateFromNowInMonthsAndDays += `${nbMonths} month${nbMonths > 1 ? "s" : ""}`;
					
					if (nbDaysLeft > 0)
						dateFromNowInMonthsAndDays += ` ${nbDaysLeft} days`;
				}
				
				dateFromNowInMonthsAndDays += ((now > this) ? " ago" : " from now");
				
				return dateFromNowInMonthsAndDays;
			}
		}
	}
}

UTILS.init();
