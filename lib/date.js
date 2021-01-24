
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', {
	hour:'2-digit',
	minute:'2-digit',
	hc: 'h24', hour12: false,
	timeZoneName: "short", timeZone: "Europe/Paris"
});

module.exports = {

	getWeekday(date, list = ["Lundi","Mardi","Mecredi","Jeudi","Vendredi","Samedi","Dimanche"]) {
		if(date.getDay()==0) return list[6];
		return list[date.getDay()-1];//décale cars Sunday==0 et Monday==1
	},
	getMonth(date, list = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]) {
		return list[date.getMonth()]//January==0
	},
	

	getFrenchTime(date, displayTimezone) {
		if(!date) return;
		const [{ value:hour },,{ value:minute },,{ value:timeZoneName }] = dateTimeFormat.formatToParts(date);
		const timezone = displayTimezone ? ` (${timeZoneName})` : '';
		return `${hour}h${minute}` + timezone;
	},
	getCurrentFrenchTime(displayTimezone) {
		return this.getFrenchTime(new Date(), displayTimezone);
	},

	getFrenchDate(date, options = {}) {
		if(typeof date != "object") date = new Date(date);
		const weekday = this.getWeekday(date, options.listWeekday);
		const dateNum = date.getDate();
		const month = this.getMonth(date, options.listMonth);
		const frenchTime = this.getFrenchTime(date, true);
		return `le ${weekday} ${dateNum} ${month} à ${frenchTime}`;
	},


	getUTCCurrentDate() { return (new Date()).toUTCString(); },





	getDurationTime(duration) {
		var seconde = Math.ceil(duration / 100) / 10;//msec => s avec un chiffre après la virgule
		if(seconde <= 60) return `${seconde} secondes`;
		var minute = Math.floor(seconde / 60); seconde %= 60;
		seconde = Math.ceil(seconde * 10) / 10;//securité
		if(minute <= 60) return `${minute} minutes ${seconde} secondes`;
		var heure = Math.floor(minute / 60); minute %= 60;
		if(heure <= 48) return `${heure} heures ${minute} minutes ${seconde} secondes`;
		//après 2 jours (ça fait plus jolie)
		var jour = Math.floor(heure / 24); heure %= 24;
		if(jour <= 730) return `${jour} jours ${heure} heures ${minute} minutes ${seconde} secondes`;
		//après 2 ans
		var ans = Math.floor(jour / 365.25); jour = Math.ceil(jour % 365.25);
	
		return `${ans} ans ${jour} jours ${heure} heures ${minute} minutes ${seconde} secondes`;
	}
}