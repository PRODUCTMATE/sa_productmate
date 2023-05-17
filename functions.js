// sometimes page has params like a particular date or something like that,
// so this function extracts these params and appends them to the API request URL
const pageWithParamsToUrl = (page) => {
	const params = new URLSearchParams(page.params)
	return `https://simpleanalytics.com/productmate.de.json?version=5&fields=visitors&pages=${page.path}&${params}`
}

// convert number like 14841 to 14,841
const formatNumber = (number) => {
	return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// receives the full html of the page as a string
// gets every path/page element
// and depending on specific path, fetches SA API endpoint of the page
// and renders unique visitors
const extractUniqueVisitors = (htmlString) => {
	const pagesEl = document.querySelector(".pages")
	const pagesEls = pagesEl.querySelectorAll("tbody")
	const pagesElsChildren = pagesEls[0].querySelectorAll("tr")

	Array.from(pagesElsChildren).map(el => {
		const linkEl = el.querySelector("a")
		const href = linkEl.getAttribute("href")
		const path = href.split("?")[0].replace("/productmate.de", "")
		const params = new URLSearchParams(href.split("?")[1])
		const paramsObj = {}
		for (const [key, value] of params.entries()) {
			paramsObj[key] = value
		}
		const pageWithParams = { path, params: paramsObj }

		const url = pageWithParamsToUrl(pageWithParams)

		fetch(url)
			.then(response => response.json())
			.then(data => renderVisitorsInfo(el, data.visitors))
			.catch(error => console.error(error))
	})

}

// takes an element and injects/appends visitor info into it
const renderVisitorsInfo = (el, visitors) => {
	// get td element within the target el
	const tdEl = el.querySelector("td")
	// remove all children from td element that have class "visitors-count"
	const visitorsEls = tdEl.querySelectorAll(".visitors-count")
	visitorsEls.forEach(el => el.remove())
	
	// append visitors number to the content of the element
	const visitorsEl = document.createElement("div")
	visitorsEl.classList.add("visitors-count")
	visitorsEl.innerText = formatNumber(visitors)
	tdEl.appendChild(visitorsEl)
}

// check whether there's .pages element
// if there's none, try again in 1000ms
// try that 10 times
// if there's still none, stop trying
// Needed cause we don't know when the content of the page is finished rendering
const tryToGetVisitors = (tries = 0) => {
	console.log("tryToGetVisitors", tries)
	const pagesEl = document.querySelector(".pages")
	if (pagesEl) {
		extractUniqueVisitors(pagesEl.innerHTML)
	} else if (tries < 10) {
		setTimeout(() => tryToGetVisitors(tries + 1), 1000)
	}
}

// we want to show more pages
// so this function tries to do that once the button is rendered
const tryToClickNext = (tries = 0) => {
	console.log("tryToClickNext", tries)
	// get all .next elements
	const nextEls = document.querySelectorAll(".next")
    // we need the 4th one
	const nextEl = nextEls[3]

	if (nextEl) {
		nextEl.click()
		window.setTimeout(() => tryToGetVisitors(), 1000)
	} else if (tries < 10) {
		setTimeout(() => tryToClickNext(tries + 1), 1000)
	}
}

// we don't know when the data on the page was updated,
// so this adds a button that allows to manually update the visitors count
const injectUpdateCountsButton = () => {
	const button = document.createElement("button")
	button.innerText = "Refresh visitors count"
	button.classList.add("pm-btn")
	button.addEventListener("click", () => {
		tryToGetVisitors()
	})
	document.body.appendChild(button)
}