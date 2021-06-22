import { TemporaryKVDatabase } from '../../lib/database.js';
import { EmbedMaker } from '../../lib/messageMaker.js';
import { getFrenchDate } from '../../lib/date.js';
import { sendWeatherRequest } from '../meteo.js';
import { countInvitesPerUserSorted, embedInvitesList, getInvites } from '../miscellaneous/invit.js';
import { CommandContext, ReceivedCommand } from '../../bot/command/received.js';
import { Guild, User } from 'discord.js';
import { guild_plenitude } from '../../bot/command/security.js';
import DiscordBot from '../../bot/bot.js';
var kvPlenitude = new TemporaryKVDatabase(undefined, 'plenitude', { createTable: true, insertIfNotExist: true }, 10000);
var kvInvite = new TemporaryKVDatabase(undefined, 'plenitude_invite', { createTable: true, insertIfNotExist: true }, 10000);

const PlenWeekdays = ['Primidi', 'Duodi', 'Tridi', 'Quartidi', 'Quintidi', 'Sextidi', 'Septidi'];
const PlenMonths = [
	'Pluviôse',
	'Ventôse',
	'Germinal',
	'Floréal',
	'Prairial',
	'Messidor',
	'Thermidor',
	'Fructidor',
	'Vendémiaire',
	'Brumaire',
	'Frimaire',
	'Nivôse',
];
const plenitudeGuildId = '626121178163183628';
var dailyNewsTimer = undefined;

const PlenCity = {
	value: kvPlenitude.getRow('PlenCity'),

	/**
	 * Get the location of Plénitude
	 * @returns {Promise<string>} The current location
	 */
	get: async _ => (await PlenCity.value.get()) || 'Chamonix-Mont-Blanc',
	/**
	 * Change the location of Plénitude
	 * @param {string} location Where you want to move
	 * @returns {Promise<string>} The new location
	 */
	set: async function (location) {
		await PlenCity.value.set(location);
		const answer = await PlenCity.get();
		console.log(`La ville de Plénitude est maintenant ${answer}`);
		return answer;
	},
};

/**
 * Get the location of Plénitude
 */
export const getLocation = PlenCity.get;
/**
 * Change the location of Plénitude
 * @param {string} l The new location
 */
export const setLocation = PlenCity.set;

export default {
	name: 'plénitude',
	description: 'Commandes de Plénitude',
	interaction: true,

	security: {
		place: 'public',
	},

	options: [
		{
			name: 'météo',
			description: 'La météo actuelle de Plénitude',
			type: 1,
			execute: getMeteo,
		},
		{
			name: 'info',
			description: 'Informations sur Plénitude',
			type: 1,
			execute: getInfo,
		},
		{
			name: 'invite_score',
			description: 'Affiche le score des invitations',
			type: 1,
			security: {
				/** @param {CommandContext} context */
				isAllowedToUse: context => guild_plenitude.includes(context.guild_id),
			},
			execute: getInviteScore,
		},
		{
			name: 'invite_end',
			description: 'Affiche le score des invitations',
			type: 1,
			security: {
				/**
				 * @param {CommandContext} context
				 */
				isAllowedToUse(context) {
					if (!guild_plenitude.includes(context.guild_id)) return false;
					const user = context.guild?.members?.cache.get(context.author?.id); //si on veut passer en fetch il faut TOUT passer en async...
					//donc dans cette situation là il faut que l'user envoie au un message avant
					if (!user) return false;
					const userRole = user.roles?.cache;
					//Maître du Jeu || admin || Jiogo
					return userRole?.has('626121766061867020') || userRole?.has('652843400646885376') || userRole?.has('816090157207650355');
				},
			},
			execute: closeInvitesCompetition,
		},
	],

	execute: getInfo,

	getMeteo,
	getLocation,
	setLocation,
	/**
	 * @param {DiscordBot} bot
	 */
	setBot: bot => {
		kvPlenitude.setDatabase(bot.database);
		kvInvite.setDatabase(bot.database);

		const channelDailyWeather = await bot.channels.fetch('849614508040519700'); // farundir-salé-du-marais
		// timer for the weather
		const time = Date.now();
		// le 22/06/2021 à 8h00 il était 1623110400s = 450864 heures
		const twoHoursSinceEpoch = Math.floor(time / 1000 / 3600 / 2); // 2 hours
		const twoHoursTimeForInterval = twoHoursSinceEpoch + 1;
		const timeForInterval = twoHoursTimeForInterval * 1000 * 3600 * 2;
		setTimeout(() => {
			updateDailyWeather(channelDailyWeather);
			dailyNewsTimer = setInterval(() => updateDailyWeather(channelDailyWeather), 7200000);
		}, timeForInterval - time);
	},
};

function makeMessage(description) {
	return new EmbedMaker('Plénitude', description);
}
function makeError(description) {
	return new EmbedMaker('Plénitude', description, { color: 'red' });
}

/**
 * Get the meteo at Plénitude
 * @returns The meteo in an embed message
 */
export async function getMeteo() {
	return sendWeatherRequest(await PlenCity.get(), onWeatherPlenitude);
}
/**
 * Called when data for the meteo of Plénitude was received
 * @param {*} data The data received by the meteo
 */
function onWeatherPlenitude(data) {
	console.log(`onWeatherPlenitude : PlenCity is "${data.name}"`);
	data.name = 'Plénitude';
	data.date = getFrenchDate(data.dt * 1000, { listWeekday: PlenWeekdays, listMonth: PlenMonths });
}

/**
 * Update the news in a channel every 2 hours
 * @param {TextChannel} channel
 */
async function updateDailyWeather(channelDailyWeather) {
	const hour = new Date().getHours();
	if (hour < 7 || 17 < hour) return; // hours : 8, 10, 12, 14, 16
	
	var answer = getMeteo();
	answer = await answer;
	channelDailyWeather.send(answer.getForMessage());
}

/**
 * Get the generic info of Plénitude
 */
function getInfo() {
	return makeMessage(`La ville de Plénitude reste un lieu fictif.
	Seule ville de Zemlji et par conséquent sa capitale, c'est une cité coloniale en pleine expansion où l'esclavage y est devenu une nécessité.
	L'île en elle-même présente un climat tempéré.`);
}

/**
 * Get the invites of the mounth per user
 * @param {Guild} guild The guild with the invites
 * @param {number} maxInvits The number of invites to display
 */
async function getCurrentInviteList(guild, maxInvits = -1) {
	var invites = await getInvites(guild);
	if (!invites) return;
	//remove the old count from the invite (uses since the competition has started)
	await Promise.all(invites.map(async i => (i.uses -= (await kvInvite.get(i.code)) || 0)));

	const invitesSorted = countInvitesPerUserSorted(invites);
	if (maxInvits > -1) invitesSorted = invitesSorted.slice(0, maxInvits);
	return invitesSorted;
}

/**
 * Count the number of uses of invites
 * @param {[{user: User, uses: number}]} invites
 */
function countInvitedMembers(invites) {
	var count = 0;
	invites.forEach(i => (count += i.uses));
	return count;
}

/**
 * Get the number of invites of the month per user
 * @param {ReceivedCommand} cmdData
 */
async function getInviteScore(cmdData) {
	const guild = cmdData.bot.guilds.cache.get(plenitudeGuildId);

	/**
	 * Number of uses of invites created by an user since the copetition has started
	 * @type {[{user: User, uses: number}]}
	 */
	var invitesSorted;
	try {
		invitesSorted = await getCurrentInviteList(guild);
		if (!invitesSorted?.length) {
			return makeMessage(`Il n'y a pas d'invitations dans ${guild.name}`);
		}
	} catch (err) {
		console.error(`Error with getCurrentInviteList`.red, err);
		return makeError(err);
	}

	var countNewInvit = countInvitedMembers(invitesSorted);
	const countDesc = await embedInvitesList(invitesSorted, cmdData.guild);
	const dateResetmsec = parseInt(await kvPlenitude.get('InvitResetTime')) || 0;
	const dateReset = getFrenchDate(new Date(dateResetmsec));
	return makeMessage([`Il y a ${countNewInvit} nouveaux membres depuis ${dateReset} :`, ...countDesc].join('\n'));
}

/**
 * Is the user can be in the competition
 * @param {User} user
 */
function isInvitesAllowedUser(user) {
	return !['344183028366442497', '302050872383242240'].includes(user?.id);
}

/**
 * Close the competition and get the winner of the month
 * @param {ReceivedCommand} cmdData
 */
async function closeInvitesCompetition(cmdData) {
	const guild = cmdData.bot.guilds.cache.get(plenitudeGuildId);

	/**
	 * Number of uses of invites created by an user since the copetition has started
	 * @type {[{user: User, uses: number}]}
	 */
	var invitesSorted;
	try {
		invitesSorted = await getCurrentInviteList(guild);
		if (!invitesSorted?.length) {
			return makeMessage(`Il n'y a pas d'invitations sur ce serveur`);
		}
	} catch (err) {
		return makeError(err);
	}

	const dateResetmsec = parseInt((await kvPlenitude.get('InvitResetTime')) || 0) || 0;
	const dateReset = getFrenchDate(new Date(dateResetmsec));

	var winners = invitesSorted.filter(i => isInvitesAllowedUser(i.user));

	const bestScore = winners?.[0]?.uses;
	if (bestScore == 0) {
		// si le meilleur score est 0 alors personne n'a gagné
		return makeMessage(`Il n'y a pas de gagnant ce mois-ci, il n'y a pas eu de nouveau membre depuis ${dateReset}.`);
	}
	winners = winners.filter(i => i.uses == bestScore);

	var winnerStr;
	switch (winners?.length) {
		case undefined:
		case 0:
			winnerStr = `Il n'y a pas de gagnant ce mois-ci.`;
			break;
		case 1:
			winnerStr = `Ce mois-ci le gagnant est ${winners[0]?.user?.toString()} (${winners[0]?.user?.username}) !`;
			break;
		default:
			winnerStr = `Ce mois-ci nous avons ${winners.length} gagnants : ${winners.join(', ')} !`;
			break;
	}

	//and set the current uses in the database
	const invites = await getInvites(guild);
	await Promise.all(invites.map(async i => await kvInvite.set(i.code, i.uses)));

	kvPlenitude.set('InvitResetTime', Date.now());

	const countDesc = await embedInvitesList(invitesSorted.splice(0, 5), cmdData.guild);
	return makeMessage(
		[`${winnerStr}\n${countInvitedMembers(invitesSorted)} nouveaux membres ont rejoints le serveur\n\nLes 5 premiers sont :`, ...countDesc].join('\n')
	);
}
