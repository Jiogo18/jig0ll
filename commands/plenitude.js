const Keyv = require("keyv");//store PlenCity
var keyv = new Keyv();
keyv = new Keyv(process.env.DATABASE_URL);//with SQLite (local) or Postgre (Heroku)
keyv.on('error', err => console.error('Keyv connection error:', err));
const MessageMaker = require("../Interaction/messageMaker.js");


const PlenWeekdays=["Primidi","Duodi","Tridi","Quartidi","Quintidi","Sextidi","Septidi"];
const PlenMonths=["Pluviôse","Ventôse","Germinal","Floréal","Prairial","Messidor","Thermidor","Fructidor","Vendémiaire","Brumaire","Frimaire","Nivôse"];


const PlenCity = {
	lastLocation: 'Plénitude',
	lastUpdate: 0,

	get: async function () {
		if(this.lastUpdate + 1000 <= Date.now()) {
			const name = await keyv.get('PlenCity');
			this.lastLocation = (name && name != '') ? name : 'Bayonne';
			this.lastUpdate = Date.now();
		}
		return this.lastLocation;
		//you need to set async and await everywhere this function is called
	},
	set: async function (location) {
		await keyv.set('PlenCity', location || 'Bayonne');
		
		answer = `La ville de Plénitude est maintenant ${await this.get()}`;
		console.log(answer);
		return answer;
	}
}


module.exports = {
	name: 'plénitude',
	description: "Commandes de Plénitude",
	interaction: true,
	public: true,
	wip: true,

	options: [{
		name: 'météo',
		description: 'La météo actuelle de Plénitude',
		type: 1,
		execute: getMeteo
	},{
		name: 'info',
		description: 'Informations sur Plénitude',
		type: 1,
		execute() { return new MessageMaker.Embed('', "Plénitude est un lieu fictif avec un climat tropical"); }
	}],

	getMeteo: getMeteo
}



async function getMeteo() {
	return await require("./meteo.js").sendWeatherRequest(
		await PlenCity.get(), onWeatherPlenitude
		);
}

function onWeatherPlenitude(data) {
	console.log(`onWeatherPlenitude : PlenCity is "${data.name}"`);
	data.name = "Plénitude";
	data.date = require("./meteo.js").getMeteoDate(data.dt, PlenWeekdays, PlenMonths);
}