export const prefixs = ['!', `<@!${process.env.BOT_ID}> `];
export function splitCommand(content) {
	//split mais de façon logique pour les ""
	//TODO : copie de commandes/commande.js donc il faut voir pour optimiser
	var msgSplit = [""];
	var onStr = false;
	for (let i = 0; i < content.length; i++) {
		if (content[i] == "\\") {
			i++;
			continue; //on saute meme le prochain char
		}
		if (content[i] == "\"") {
			onStr = !onStr;
			if (onStr && msgSplit[msgSplit.length - 1].length > 0)
				msgSplit[msgSplit.length] = ""; //on ajoute une case
			continue; //on le save pas
		}
		if (!onStr && content[i] == " ") { //prochain arg
			msgSplit[msgSplit.length] = ""; //on ajoute une case
			continue; //si on laisse plusieurs cases vides c'est pas grave (erreur de cmd)
		}
		msgSplit[msgSplit.length - 1] = msgSplit[msgSplit.length - 1] + content[i]; //on ajoute le char
	}
	return msgSplit;
}
export function removePrefix(content) {
	for (const prefix of this.prefixs) {
		if (!content.startsWith(prefix))
			continue;

		content = content.substring(prefix.length);
		return [content, prefix];
	}
	return [content, undefined];
}

export default {
	prefixs,
	splitCommand,
	removePrefix,
}