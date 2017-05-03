import "material-design-lite";
import re from "../../common/regex";
!function() {
	const $ = query => document.querySelector.bind(document)(query);
	const $$ = query => Array.from(document.querySelectorAll.bind(document)(query));
	const url = $("#url");
	const customID = $("#custom-id");
	const shortenButton = $("button[shorten]");
	const copyButton = $("button[copy]");
	const inputs = $$("input");
	const result = $("#result");
	const userInputs = [url, customID];
	const errors = {
		INVALID_URL: `This URL is invalid. Is "http://" mising?`,
		INVALID_KEY: "This ID is invalid.",
		BANNED_URL: "Sorry, this URL is blacklisted.",
		KEY_UNAVAILABLE: "This ID is already in use. Please choose another.",
		LOW_ENTROPY: "The entropy is too low. Please contact the administrator.",
		RATE_LIMITED: "You've sent too many requests. Try again later.",
		LEADING_WHITESPACE: "IDs may not start with whitespace characters.",
		TRAILING_WHITESPACE: "IDs may not end in whitespace characters.",
		CONSECUTIVE_WHITESPACE: "IDs may not contain consecutive whitespace characters.",
		RELATIVE_PATHS: "IDs may not contain relative URL paths.",
		URL_COPY_FAILURE: "Your browser doesn't support writing to clipboards."
	};
	const URL_COPIED = "URL copied to clipboard!";
	function sendRequest() {
		const data = {
			shortName: encodeURIComponent(customID.value),
			url: url.value
		};
		if (url.validity.valid && customID.validity.valid) {
			const request = new XMLHttpRequest();
			request.open("POST", "/api/create");
			request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			request.onload = e => {
				try {
					const response = JSON.parse(request.response);
					if (response.error) {
						const status = customID.parentElement.querySelector("shortener-status");
						const urlStatus = url.parentElement.querySelector("shortener-status");
						let text = null;
						switch (response.errorCode) {
							case "INVALID_URL":
								urlStatus.innerText = errors.INVALID_URL;
								urlStatus.style.opacity = 1;
								return;
							case "BANNED_URL":
								urlStatus.innerText = errors.BANNED_URL;
								urlStatus.style.opacity = 1;
								return;
							case "KEY_UNAVAILABLE":
								text = errors.KEY_UNAVAILABLE;
								break;
							case "LOW_ENTROPY":
								text = errors.LOW_ENTROPY;
								break;
						}
						status.style.opacity = 1;
						status.innerText = text;
					}
					else {
						result.value = document.location.href + decodeURIComponent(response.shortName);
						result.parentElement.parentElement.style.opacity = 1;
						setButton(copyButton, true);
						result.select();
					}
				}
				catch (e) {
					let status = customID.parentElement.querySelector("shortener-status");
					status.style.opacity = 1;
					status.innerText = errors.RATE_LIMITED;
				}
			};
			request.send(JSON.stringify(data));
		}
	}
	function copyToClipboard() {
		function setCopyStatus(s) {
			const status = result.parentElement.querySelector("shortener-status");
			status.style.opacity = 1;
			if (s) {
				status.style.color = "green";
				status.innerText = URL_COPIED;
			}
			else {
				status.style.color = "red";
				status.innerText = errors.URL_COPY_FAILURE;
			}
		}
		result.select();
		try {
			const success = document.execCommand("copy");
			if (success) {
				setCopyStatus(true);
			}
			else {
				setCopyStatus(false);
			}
		}
		catch (e) {
			setCopyStatus(false);
		}
		finally {
			window.getSelection().removeAllRanges();
		}
	}
	function setButton(button, enable) {
		const propertyDisabled = "disabled";
		const classAccent = "mdl-button--accent";
		if (enable) {
			button.classList.add(classAccent);
			button.removeAttribute(propertyDisabled);
		}
		else {
			button.classList.remove(classAccent);
			button.setAttribute(propertyDisabled, "");
		}
	}
	shortenButton.addEventListener("click", sendRequest);
	copyButton.addEventListener("click", copyToClipboard);
	for (const input of userInputs) {
		input.addEventListener("keyup", e => {
			if (e.keyCode === 13) {
				sendRequest();
			}
		});
		input.addEventListener("input", e => {
			const status = input.parentElement.querySelector("shortener-status");
			let errorString = "";
			if (!input.validity.valid) {
				switch (input) {
					case url:
						errorString = errors.INVALID_URL;
						break;
					case customID:
						const v = input.value;
						let invalid = null;
						if (re.config.noUnsafeCharacters) {
							invalid = re.invert(re.purify(re.patterns.noUnsafeCharacters)).exec(v);
							if (invalid !== null) {
								invalid = invalid.reduce((a, b) => a ? a : b);
								errorString = `IDs may not contain the character "${invalid}".`;
								break;
							}
						}
						if (!invalid) {
							switch (true) {
								case !re.patterns.noLeadingSpaces.test(v):
									errorString = errors.LEADING_WHITESPACE;
									break;
								case !re.patterns.noTrailingSpaces.test(v):
									errorString = errors.TRAILING_WHITESPACE;
									break;
								case !re.patterns.noConsecutiveSpaces.test(v):
									errorString = errors.CONSECUTIVE_WHITESPACE;
									break;
								case !re.patterns.noRelativePaths.test(v):
									errorString = errors.RELATIVE_PATHS;
									break;
								default:
									errorString = errors.INVALID_KEY;
									break;
							}
						}
				}
			}
			if (errorString === "") {
				status.style.opacity = 0;
			}
			else {
				status.style.opacity = 1;
				status.innerText = errorString;
			}
			function inputsValid() {
				return userInputs.every(input => {
					return input.validity.valid;
				});
			}
			if (inputsValid()) {
				setButton(shortenButton, true);
			}
			else {
				setButton(shortenButton, false);
			}
		});
	}
	url.addEventListener("blur", e => {
		if (!(/^\w+:\/\//.test(url.value))) {
		}
	});
}();