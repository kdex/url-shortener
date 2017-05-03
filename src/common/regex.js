import escape from "regexp.escape";
//let config = JSON.parse(require("fs").readFileSync("./.tmp/public.json", "utf-8")).regex;
// let config = require("./.tmp/public.json").regex;
// import { regex as config } from "/.tmp/public.json";
const config = {
	noUnsafeCharacters: true,
	noLeadingSpaces: true,
	noTrailingSpaces: true,
	noConsecutiveSpaces: true,
	noRelativePaths: true
};
const SINGULARIZATION_START = /^/;
const SINGULARIZATION_END = /.*$/;
let patterns = {
	noUnsafeCharacters: /(?!.*(%FORBIDDEN_CHARACTERS%)+)/,
	noLeadingSpaces: /(?=\S)/,
	noTrailingSpaces: /(?=.*\S$)/,
	noConsecutiveSpaces: /(?!.*\s{2,})/,
	noRelativePaths: /(?!(?:.*\/)?\.{1,2}\/?(?!\.))/
};
patterns.noUnsafeCharacters = new RegExp(patterns.noUnsafeCharacters.source.replace("%FORBIDDEN_CHARACTERS%", config.noUnsafeCharacters));
function getPatterns() {
	return Object.keys(patterns).filter(key => config[key]).map(key => patterns[key]);
}
function merge(regexA, regexB) {
	return new RegExp(regexA.source + regexB.source);
}
function singularize(regex) {
	return new RegExp(SINGULARIZATION_START.source + regex.source + SINGULARIZATION_END.source);
}
function invert(regex) {
	let unpurify = regex.source.startsWith(SINGULARIZATION_START.source);
	let source = purify(regex).source;
	const POSITIVE = "(?=";
	const NEGATIVE = "(?!";
	if (source.startsWith(POSITIVE)) {
		source = source.replace(POSITIVE, NEGATIVE);
	}
	else {
		source = source.replace(NEGATIVE, POSITIVE);
	}
	let re = new RegExp(source);
	if (unpurify) {
		re = singularize(re);
	}
	return re;
}
function purify(regex) {
	let source = regex.source;
	let start = new RegExp("^" + escape(SINGULARIZATION_START.source));
	let end = new RegExp(escape(SINGULARIZATION_END.source) + "$");
	source = source.replace(start, "").replace(end, "");
	return new RegExp(source);
}
let merged = getPatterns().reduce((patternA, patternB) => {
	return merge(patternA, patternB);
});
//let singlePatterns = Object.assign({}, patterns);
let singlePatterns = patterns;
for (let prop in singlePatterns) {
	let pattern = singlePatterns[prop];
	singlePatterns[prop] = singularize(singlePatterns[prop]);
}
export default {
	invert,
	purify,
	singularize,
	merge,
	config,
	patterns: singlePatterns,
	regex: singularize(merged)
};