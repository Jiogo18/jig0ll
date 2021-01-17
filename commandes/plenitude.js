const Keyv = require("keyv");//store PlenCity
var keyv = new Keyv();
keyv = new Keyv(process.env.DATABASE_URL);//with SQLite (local) or Postgre (Heroku)
keyv.on('error', err => console.error('Keyv connection error:', err));


const PlenWeekdays=["Primidi","Duodi","Tridi","Quartidi","Quintidi","Sextidi","Septidi"];
const PlenMonths=["Pluviôse","Ventôse","Germinal","Floréal","Prairial","Messidor","Thermidor","Fructidor","Vendémiaire","Brumaire","Frimaire","Nivôse"];

module.exports = class CmdPlenitude {
	
	static isAction(msg) {
		return msg.length > 0 && /pl[eé]nitude/i.test(msg[0]);
	}
	static action(message,msg) {
		if(msg.length < 2) {
			sendMsgHelp(message.channel);
			return;
		}
		
		switch(msg[1].toLowerCase()) {
			case "help":
				sendMsgHelp(message.channel);
				break;
			case "meteo": case "metéo": case "méteo": case "météo":
				this.askWeather(message);
				break;
			case "info":
				sendMsg(message.channel,
					"Plénitude est un lieu fictif avec un climat tropical"
					);
				break;

			case "get":
				this.getCmd(message, msg);
				break;

			case "set":
				this.setCmd(message, msg);
				break;
				
		}
	}

	
	static getHelp(complet) {
		if(complet)
			return "plenitude <commande>: Commandes spécifiques de Plénitude"
				+"\n\u200b \u200b meteo: La météo de Plénitude"
				+"\n\u200b \u200b info: Informations sur Plénitude"
		else
			return "plenitude <commande>: Commandes spécifiques de Plénitude";
	}
	
	


	static onWeatherPlenitude(message,city,data) {
		console.log(`onWeatherPlenitude : PlenCity is "${data.name}"`);
		data.name = "Plénitude";
		require("./meteo.js").onWeather(message, "Plénitude", data, PlenWeekdays, PlenMonths);
	}
	static async askWeather(message) {
		require("./meteo.js").sendWeatherRequest(
			message,CmdPlenitude.onWeatherPlenitude,
			await this.PlenCity()
			);
	}


	
	static async PlenCity() {
		const name = await keyv.get('PlenCity');
		if(name && name != "") return name;
		return  "Bayonne";
		//you need to set async and await everywhere this function is called
	}

	static async getCmd(message, msg) {
		if(msg.length < 3) {
			sendMsgHelp(message.channel);
			return;
		}
		switch(msg[2].toLowerCase()) {
			case "location":
				if(!locationPermission(message)) sendMsgPermissionRequired(message);

				var target = message.author;
				if(msg.length >= 3 && msg[3] == "--all") target = message.channel;
				sendMsg(target,
					"La ville de Plénitude se trouve à " + await this.PlenCity()
					);
				break;
		}
	}
	static async setCmd(message, msg) {
		if(msg.length < 3) {
			sendMsgHelp(message.channel);
			return;
		}

		switch(msg[2].toLowerCase()) {
			case "location":
				if(!locationPermission(message)) sendMsgPermissionRequired(message);
				if(msg.length < 3) {
					this.getCmd(message, msg);
					return;
				}
				await keyv.set("PlenCity", msg[3] || "Bayonne");
				
				sendMsg(message.channel,
					"La ville de Plénitude est maintenant " + await this.PlenCity()
					);
				break;
		}
	}
}


function sendMsg(target, content, color) {
	target.send({embed:{//target is a User, a Channel...
		color: color || 3447003,//color or Blue
		title: "Plénitude",
		description: content
	}});
}
function sendMsgHelp(target) {
	sendMsg(target, module.exports.getHelp(true));
}
function sendMsgPermissionRequired(message) {
	sendMsg(message.channel,
		`Désolé ${message.author} vous n'avez pas la permission de faire cela.`,
		13369344//red
		);
}

function locationPermission(message) {
	switch(message.author.id) {
		case "262213332600225792"://Rubis
		case "175985476165959681"://Jiogo18
			return true;
	}
	return false;
}