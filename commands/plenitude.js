const DataBase = require('../lib/database.js');
const MessageMaker = require("../lib/messageMaker.js");
const libDate = require('../lib/date.js');


const PlenWeekdays=["Primidi","Duodi","Tridi","Quartidi","Quintidi","Sextidi","Septidi"];
const PlenMonths=["Pluviôse","Ventôse","Germinal","Floréal","Prairial","Messidor","Thermidor","Fructidor","Vendémiaire","Brumaire","Frimaire","Nivôse"];


const PlenCity = {
	database: new DataBase('PlenCity', 'Bayonne', 10000),

	get: async function () {
		return await PlenCity.database.get();
		//you need to set async and await everywhere this function is called
	},
	set: async function (location) {
		const answer = await PlenCity.database.set(location);
		console.log(`La ville de Plénitude est maintenant ${answer}`);
		return answer;
	}
}


module.exports = {
	name: 'plénitude',
	description: "Commandes de Plénitude",
	interaction: true,

	security: {
		place: 'public',
	},

	options: [{
		name: 'météo',
		description: 'La météo actuelle de Plénitude',
		type: 1,
		execute: getMeteo
	},{
		name: 'info',
		description: 'Informations sur Plénitude',
		type: 1,
		execute: getInfo
	}],

	execute: getInfo,

	getMeteo: getMeteo,
	getLocation: PlenCity.get,
	setLocation: PlenCity.set,
}



async function getMeteo() {
	return await require("./meteo.js").sendWeatherRequest(
		await PlenCity.get(), onWeatherPlenitude
		);
}

function onWeatherPlenitude(data) {
	console.log(`onWeatherPlenitude : PlenCity is "${data.name}"`);
	data.name = "Plénitude";
	data.date = libDate.getFrenchDate(data.dt*1000, { listWeekday: PlenWeekdays, listMonth: PlenMonths });
}

function getInfo() {
	return new MessageMaker.Embed('Plénitude', "Plénitude est un lieu fictif avec un climat tropical");
}