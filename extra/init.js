hljs.registerLanguage("graphql", window.hljsDefineGraphQL);
hljs.highlightAll();
hljs.initLineNumbersOnLoad();


$(document).ready(() => {
	
	// mapping all GraphQL items (Name to Href URL)
	const hrefs={}
	$('nav[aria-label="GraphQL reference"] a.md-nav__link').each((index, el) => {
		el = $(el);
		hrefs[el.text().trim()] = el.attr('href');
	})
	// console.log(hrefs)

	// Hyperlinking all GraphQL types on page
	$('.hljs-type').each((index, el) => {
		if (!index) return; // skip first
		el = $(el);
		let txt = el.text().trim();
		console.log(txt)
		if (hrefs[txt]) {
			el.html(`<a href="${hrefs[txt]}">${txt}</a>`)	
		} else {
			el.text(`${txt}`)
		}
	});
})