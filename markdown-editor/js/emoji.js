const REGEX_EMOJI = /:(\w+):/g;

this.replacer = function (match, name) {
	let img = new Image();

	img.src = `./img/emoji/${name}.png`;

	if (img.height != 0) {
		return `<img class="emoji" src="./img/emoji/${name}.png" title="${name}" height="20px">`;
	}
	else {
		return match;
	}
};

function replaceWithEmojis(emoji) {
	return emoji.replace(REGEX_EMOJI, this.replacer);
}
