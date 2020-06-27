//const CmdMeteo = require("./meteo.js");//insception ne marche pas ?
const PlenCity="Bayonne";
const PlenWeekdays=["Primidi","Duodi","Tridi","Quartidi","Quintidi","Sextidi","Septidi"];
const PlenMonths=["Pluviôse","Ventôse","Germinal","Floréal","Prairial","Messidor","Thermidor","Fructidor","Vendémiaire","Brumaire","Frimaire","Nivôse"];

module.exports = class CmdPlenitude {
	static isAction(msg) {
		return msg.length>0 && (msg[0].toLowerCase()=="plenitude" || msg[0].toLowerCase()=="plénitude");
	}
	static action(message,msg) {
		if(msg.length == 1) {
			message.channel.send({embed:{
				color: 3447003,
				title: "Plénitude",
				description: this.getHelp(true)
			}});
			return;
		}
		switch(msg[1].toLowerCase()) {
			case "meteo":
			case "météo":
				this.askWeather(message);
				break;
			case "info":
				message.channel.send({embed:{
					color: 3447003,
					title: "Plénitude",
					description: "Plénitude est un lieu fictif avec un climat tropical (météo basée sur Bayonne)"
				}});
				break;
		}
	}
	static getHelp(complet) {
		if(complet)
			return "plenitude <commande>: Commandes spécifiques de Plénitude"
				+"\n\u200b \u200b meteo: La météo de Plénitude"
		else
			return "plenitude <commande>: Commandes spécifiques de Plénitude";
	}


	static onWeatherPlenitude(message,city,data) {
		data.name = "Plénitude";
		require("./meteo.js").onWeather(message,"Plénitude",data,PlenWeekdays,PlenMonths);
	}
	static askWeather(message) {
		require("./meteo.js").sendWeatherRequest(message,CmdPlenitude.onWeatherPlenitude,PlenCity);
	}
}




