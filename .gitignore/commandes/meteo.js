const https = require('https');
const meteoColor=3447003;
const CmdPlenitude = require("./plenitude.js");


module.exports = class CmdMeteo
{
	static isAction(msg) {
		if(msg.length>0 && (msg[0].toLowerCase()=="meteo" || msg[0].toLowerCase()=="weather"))
			return true;
		return false;
	}
	static action(message,msg) {//main
		if(msg.length == 1) {
			message.channel.send({embed:{
				color: meteoColor,
				title: "Météo",
				description: this.getHelp(true)
			}});
			return;askWeather
		}
		if(msg[1].toLowerCase()=="plenitude" || msg[1].toLowerCase()=="plénitude")
			CmdPlenitude.askWeather(message);
		else
			CmdMeteo.sendWeatherRequest(message,undefined,msg[1]);
	}
	static getHelp(complet) {
		if(complet)
			return "meteo <ville/pays> : La météo actuelle de la ville"+
				"\n\u200b \u200b (villes référencées suplémentaires: Plénitude";
		else
			return "meteo <ville/pays> : La météo actuelle de la ville";
	}


	//https://www.twilio.com/blog/2017/08/http-requests-in-node-js.html
	static sendWeatherRequest(message,func,city,state,country) {
		var q="";
		if(city) q+=city;
		if(state) q+=(q.length>0?",":"")+state;
		if(country) q+=(q.length>0?",":"")+country;
		https.get("https://api.openweathermap.org/data/2.5/weather?q="+q+"&appid="+process.env.WEATHER_KEY, (resp) => {
			let data = '';

			// A chunk of data has been recieved.
			resp.on('data', (chunk) => {
				data += chunk;
				if(func)
					func(message,city,JSON.parse(data));
				else
					CmdMeteo.onWeather(message,city,JSON.parse(data));
			});

			// The whole response has been received. Print out the result.
		}).on("error", (err) => {
			console.log("Socket Error: " + err.message);
			CmdMeteo.onWeather(message,city,{cod:404,message:"can not access to api.openweathermap.org"});
		});
	}

	static onWeather(message,city,data,listWeekdays,listMonths) {
		switch(data.cod) {
			case 200:
				message.channel.send({embed:{
					color:meteoColor,
					title:"Météo de __"+data.name+"__ le "+getMeteoDate(data,listWeekdays,listMonths),
					description: getData(data)
				}});
				break;
			default:
				message.channel.send({embed:{
					color:meteoColor,
					title:"Météo de __"+city+"__",
					description: "Code Error: "+data.cod
						+(data.cod==404?("\nMessage: "+data.message):"")
				}});
				break;
		}
	}
}


function getWeekday(date,list) {
	if(!list) list=["Lundi","Mardi","Mecredi","Jeudi","Vendredi","Samedi","Dimanche"];
	if(date.getDay()==0) return list[6];
	return list[date.getDay()-1];//décale cars Sunday==0 et Monday==1
}
function getMonth(date,list) {
	if(!list) list=["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
	return list[date.getMonth()]//January==0
}
function getMeteoDate(data,listWeekdays,listMonths) {
	var date = new Date(data.dt*1000);//s in msec
	var options = { hour:'2-digit',minute:'2-digit',hc:'h24',hour12:false,timeZoneName:"short",timeZone:"Europe/Paris" };
	const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', options);
	const [{ value:hour },,{ value:minute },,{ value:timeZoneName }] = dateTimeFormat.formatToParts(date);
	return getWeekday(date,listWeekdays)+" "+
			date.getDate()+" "+
			getMonth(date,listMonths)+
			` à ${hour}h${minute} (${timeZoneName})`;
}
function getConditionFr(condition) {
	switch(condition) {
		case "Clouds": return "Nuages";
		case "Rain": return "Pluie";
		case "Clear": return "Dégagé";
		case "Drizzle": return "Pluie fine";
		case "Mist": return "Brouillard";
		default: return condition;
	}
}
function getData(data) {
	var retour=""
	if(data.main && data.main.temp)
		retour += "Température : "+Math.round(data.main.temp-273.15)+"°C\n";
	if(data.weather && data.weather.length>0) {
		var condition=""
		for(var i=0; i<data.weather.length; i++) {
			if(i>0)
				condition += ", ";
			condition += getConditionFr(data.weather[i].main);
		}
		retour += "Condition : "+condition+"\n";
	}
	if(data.wind)
		retour += "Vitesse du vent : "+data.wind.speed+" m/s\n";
	if(data.main && data.main.humidity != undefined)
		retour += "Humidité de l'air : "+data.main.humidity+"%\n";
	if(data.sys) {
		let soleilLeve = new Date(data.sys.sunrise*1000);
		let soleilCouche = new Date(data.sys.sunset*1000);
		retour += "Présence du soleil : de ";
		var options = { hour:'2-digit',minute:'2-digit',hc:'h24',hour12:false,timeZoneName:"short",timeZone:"Europe/Paris" };
		const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', options);
		if(data.sys.sunrise && soleilLeve) {
			const [{ value:hour },,{ value:minute },,{ value:timeZoneName }] = dateTimeFormat.formatToParts(soleilLeve);
			retour += `${hour}h${minute} (${timeZoneName})`;
		}
		else
			retour += "?";
		retour += " à "
		if(data.sys.sunset && soleilCouche) {
			const [{ value:hour },,{ value:minute },,{ value:timeZoneName }] = dateTimeFormat.formatToParts(soleilCouche);
			retour += `${hour}h${minute} (${timeZoneName})`;
		}
		else
			retour += "?";
		retour += "\n";

	}

	if(retour.length>0)
		retour = retour.substring(0, retour.length-1);//remove last '\n' (it's 1 char)
	return retour;
}