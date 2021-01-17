////\u200b pour avoir plusieurs espaces

const CmdLibName = ["./help.js","./ping.js","./info.js","./test.js","./random.js","./meteo.js","./plenitude.js"];
const CmdLib = [];
for(const i in CmdLibName) {
	const libPath = CmdLibName[i];
	if(!libPath) continue;
	try {
		const lib= require(libPath);
		if(!lib) {
			console.error(`CmdLib not found : '${libPath}'`);
			continue;
		}
		CmdLib.push(lib);
	}
	catch(error) {
		console.error(`CmdLib not loaded : '${libPath}'`);
		console.error(error);
	}
}

module.exports = class Cmd
{
	static isAction(msg) {
		for(const i in CmdLib) {
			if(CmdLib[i].isAction(msg)) {
				return true;
			}
		}
		return false;
	}
	static action(bot, message, msg)
	{
		const CmdHelp = require("./help.js");
		const CmdPing = require("./ping.js");
		const CmdInfo = require("./info.js");
		const CmdTest = require("./test.js");
		const CmdRandom = require("./random.js");
		const CmdMeteo = require("./meteo.js");
		const CmdPlenitude = require("./plenitude.js");

		if(CmdHelp.isAction(msg))
			sendMsg(bot,message,CmdHelp.action(message,msg));
		else if(CmdRandom.isAction(msg))
			sendMsg(bot,message,CmdRandom.action(message,msg));
		else if(CmdPing.isAction(msg))
			sendMsg(bot,message,CmdPing.action(message,msg,bot));
		else if(CmdInfo.isAction(msg))
			sendMsg(bot,message,CmdInfo.action(message,msg));
		else if(CmdTest.isAction(msg))
			sendMsg(bot,message,CmdTest.action(message,msg));
		else if(CmdRandom.isAction(msg))
			sendMsg(bot,message,CmdRandom.action(message,msg));
		else if(CmdMeteo.isAction(msg))
			CmdMeteo.action(message,msg);
		else if(CmdPlenitude.isAction(msg))
			CmdPlenitude.action(message,msg);//plenitude
	}
	//todo : call CmdLib

	static isCommand(bot, message) {//le message est une commande valide ?
		const prefixs = ['!', `<@!${bot.user.id}> `];
		var found = false;
		for(const prefix of prefixs) {
			if(!message.content.startsWith(prefix)) continue;

			found = true;
			message.content = message.content.substring(prefix.length);
			message.prefix = prefix;
		}
		if(!found) { return; }
		

		var msg=splitCommand(message.content);

		/*if(msg.length > 0) {
			//peut importe le channel
			switch(msg[0].toLowerCase()) {
				case "cut":
				case "stop":
				case "exit":
					if(message.author.id == process.env.OWNER_ID) {//moi
						console.error("Stoppé par " + message.author);
						message.channel.send(`Stoppé par ${message.author}`);
						bot.destroy();
					}
					return null;//nothing else to do
			}
		}*/
		
		return msg;
	}
}



function sendMsg(bot,messageOriginal,messageRetour) {
	//v1 : [(int)color, (bool)author, (str)title, (str)reponse]
	//v2 : [(str)reponse, (bool)embed, (str)title, (int)color, (bool/str)author]
	if(!messageRetour)//undefined
		return
	if(messageRetour.embed)//si embed existe
	{
		var author = messageRetour.embed.author;
		messageRetour.embed.author = {};
		if(typeof(author) == "number" || typeof(author) == "boolean")//commande spéciale
		{
			switch(author)
			{
				case true://l'auteur
				case 0:
					author = messageOriginal.author;
					break;
				case 1://le bot
					author = bot.user;
					break;
			}
		}
		switch(typeof(author))
		{
			case "string":
				messageRetour.embed.author.name = author;
				break;
			case "object"://author doit etre un User
				if(author.user)//ou si author est un Client (ou autre chose contenant .user)
					author = author.user//donne un ClientUser, qui est la meme chose qu'un User
				if(author.username)//si on a la fonction username
					messageRetour.embed.author.name = author.username
				if(author.avatarURL)
					messageRetour.embed.author.icon_url = author.avatarURL
				break;
		}
		if(messageRetour.embed.author == {})
			messageRetour.embed.author = undefined;
	}
	//https://www.colorhexa.com/3498db => 3447003 (bleu)
	//rouge : #cc0000 = 13369344
	messageOriginal.channel.send(messageRetour);
}

function splitCommand(content) {
	var msgSplit=[""];
	var onStr = false;
	for(let i=0; i<content.length; i++)
	{
		if(content[i] == "\\") {
			i++;
			continue;//on saute meme le prochain char
		}
		if(content[i] == "\"") {
			onStr = !onStr;
			if(onStr && msgSplit[msgSplit.length-1].length > 0)
				msgSplit[msgSplit.length] = "";//on ajoute une case
			continue;//on le save pas
		}
		if(!onStr && content[i] == " ")
		{//prochain arg
			msgSplit[msgSplit.length] = "";//on ajoute une case
			continue;//si on laisse plusieurs cases vides c'est pas grave (erreur de cmd)
		}
		msgSplit[msgSplit.length-1] = msgSplit[msgSplit.length-1] + content[i];//on ajoute le char
	}
	return msgSplit;
}