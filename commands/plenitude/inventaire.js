import { EmbedMaker } from '../../lib/messageMaker.js';
import { ReceivedCommand } from '../../bot/command/received.js';
import { DiscordChannelDatabase } from '../../lib/discordDatabase.js';
import DiscordBot from '../../bot/bot.js';
import { User } from 'discord.js';

/**
 * @type {DiscordChannelDatabase}
 */
var channelDatabase;
/**
 * @type {DiscordBot}
 */
var bot;
async function setChannelDatabase() {
	const channel = await bot.channels.fetch('850812437258043412');
	channelDatabase = new DiscordChannelDatabase(channel);
}

/**
 * @param {string} id_prop
 * @param {User} author
 */
function getPropId(id_prop, author) {
	if (!id_prop || id_prop == '*' || id_prop == '') {
		return author.toString();
	}
	const snowflakeMatch = id_prop.match(/<@!(\d+)>/);
	if (snowflakeMatch) {
		return `<@${snowflakeMatch[1]}>`;
	}
	const snowflake2Match = id_prop.match(/<@&(\d+)>/);
	if (snowflake2Match) throw `Ce type de tag n'est pas valide : <@& ${snowflake2Match[1]} >.\nEvitez de copier/coller les tags`;
	return id_prop;
}

/**
 * @param {Function} executeFunc
 */
function createExecuteLink(executeFunc) {
	return (cmdData, levelOptions) => executeFunc(cmdData, getPropId(levelOptions.shift()?.value, cmdData.author), ...levelOptions.map(i => i?.value));
}

const invo = {
	id_source: {
		name: 'inv_source',
		description: "Inventaire source (* pour l'inventaire perso)",
		type: 3, // string
		required: true,
	},
	id_target: {
		name: 'inv',
		description: "Inventaire cible (* pour l'inventaire perso)",
		type: 3, // string
		required: true,
	},
	item_name: {
		name: 'name',
		description: "Nom de l'item",
		type: 3,
		required: true,
	},
	item_count: {
		name: 'count',
		description: "Nombre d'items",
		type: 4,
		required: false,
	},
};

export default {
	name: 'inventaire',
	description: 'Un inventaire',

	interaction: true,
	security: {
		place: 'private',
	},

	options: [
		{
			name: 'reload',
			description: 'Recharger tous les inventaires',
			type: 1,
			execute: executeReload,
		},
		{
			name: 'create',
			description: 'Créer un bâtiment',
			type: 1,
			options: [
				invo.id_target,
				{
					name: 'name_create',
					description: 'Nom du nouveau bâtiment',
					type: 3,
					required: true,
				},
			],
			executeAttribute: (cmdData, levelOptions) =>
				executeCreateBatiment(cmdData, getPropId(levelOptions[0]?.value, cmdData.author), levelOptions[1]?.value),
		},
		{
			name: 'open',
			description: "Ouvrir l'inventaire",
			type: 1,
			options: [{ ...invo.id_target, required: false }],
			execute: cmdData => executeOpen(cmdData, cmdData.author.toString()),
			executeAttribute: createExecuteLink(executeOpen),
		},
		{
			name: 'edit',
			description: "Modifier l'inventaire",
			type: 1,
			options: [
				invo.id_target,
				{
					name: 'data',
					description: '[DEBUG] Changer le nom du premier item',
					type: 3,
					required: true,
				},
			],
			executeAttribute: createExecuteLink(executeEdit),
		},
		{
			name: 'give',
			description: 'Ajouter un item',
			type: 1,
			options: [invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: createExecuteLink(executeGive),
		},
		{
			name: 'remove',
			description: 'Retirer un item',
			type: 1,
			options: [invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: createExecuteLink(executeRemove),
		},
		{
			name: 'move',
			description: "Déplacer un item d'un inventaire à un autre",
			type: 1,
			options: [invo.id_source, invo.id_target, invo.item_name, invo.item_count],
			executeAttribute: (cmdData, levelOptions) =>
				executeMove(
					cmdData,
					getPropId(levelOptions[0]?.value, cmdData.author),
					getPropId(levelOptions[1]?.value, cmdData.author),
					levelOptions[2]?.value,
					levelOptions[3]?.value
				),
		},
	],

	/**
	 * @param {DiscordBot} bot
	 */
	setBot(b) {
		bot = b;
		setTimeout(setChannelDatabase, 1000);
	},
};

class Item {
	/**
	 * @type {string}
	 */
	name;
	/**
	 * @type {number}
	 */
	count;
	constructor(name, count) {
		this.name = name;
		this.count = count;
	}
}

/**
 * Make an embed message
 * @param {string} description The content
 */
function makeMessage(description) {
	return new EmbedMaker('Inventaire', description);
}
/**
 * Make an embed message with a red color
 * @param {string} description The content
 */
function makeError(description) {
	return new EmbedMaker('Inventaire', description, { color: 'red' });
}

const messages = {
	cantOpen: md => makeError(`Cet inventaire appartient à ${md?.data?.proprietaire || md?.id} et vous ne pouvez pas voir son contenu`),
	cantEdit: md => makeError(`Cet inventaire appartient à ${md?.data?.proprietaire || md?.id} et vous ne pouvez pas modifier son contenu`),
	badName: name => makeError(`Nom invalide : ${name}`),
	itemInfo: (item, inv_id) => makeMessage(`Il y a maintenant ${item.count}x ${item.name} dans l'inventaire de ${inv_id}`),
	itemSmartInfo: (item, inv_id) => `Il y a maintenant ${item.count}x ${item.name} dans l'inventaire de ${inv_id}`,
	noItem: (item, inv_id) => makeError(`Il n'y a pas pas ${item?.count}x ${item?.name} dans l'inventaire de ${inv_id}`),
	cantAddItem: (item, inv_id) => makeError(`Vous ne pouvez pas ajouter ${item?.count}x ${item?.name} dans l'inventaire de ${inv_id}`),
};

////////////////////////// inventory_source tools //////////////////////////

/**
 * Open / Edit the inventory_source
 * @param {string} id
 * @return {Promise<{data:{inventaire:Item[],proprietaire:string}, save:function}>}
 */
async function getMessageData(id, createIfDoesntExists = false) {
	const md = await channelDatabase.getMessageData(id);
	if (!md) return;
	if (!md.data.inventaire && createIfDoesntExists) {
		md.data.inventaire = [];
	}
	return md;
}

const invMgr = {
	/**
	 * @param {Item[]} inv
	 * @param {Function} itemFilter
	 */
	getItems: (inv, itemFilter) => {
		return inv.filter(i => itemFilter(i));
	},
	/**
	 * @param {Item[]} inv
	 * @param {string} name
	 */
	getItemByName: (inv, name) => {
		return invMgr.getItems(inv, i => i.name == name)?.[0];
	},

	/**
	 * @param {{data:{proprietaire:string}, id:string}} md messageData
	 * @param {User} user
	 */
	canOpen: (md, user) => {
		return true;
	},

	/**
	 * @param {{data:{proprietaire:string}, id:string}} md messageData
	 * @param {User} user
	 */
	isPorp: (md, user) => {
		if (!md || !user) return false;
		if (md.id === user.toString()) return true;
		if (md.data?.proprietaire === user.toString()) return true;
		return false;
	},

	/**
	 * @param {Item[]} inv
	 * @param {Item} item
	 */
	removeIfDoesntExist: (inv, item) => {
		if (item.count <= 0) {
			item.count = 0;
			const index = inv.indexOf(item);
			if (index > -1) inv.splice(index, 1);
		}
	},

	/**
	 * @param {Item[]} inv
	 * @param {string} name
	 * @param {number} count
	 */
	canAddItem(inv, name, count) {
		const item = invMgr.getItemByName(inv, name);
		if ((item ? item.count : 0) + count < 0) return false; // si l'item n'existe pas on peut le rajouter
		return true;
	},

	/**
	 * @param {Item[]} inv
	 * @param {string} name
	 * @param {number} count
	 */
	canRemoveItem(inv, name, count) {
		const item = invMgr.getItemByName(inv, name);
		if ((item ? item.count : 0) - count < 0) return false;
		return true;
	},

	/**
	 * @param {Item[]} inv
	 * @param {string} name
	 * @param {number} count
	 */
	addItem(inv, name, count) {
		if (!invMgr.canAddItem(inv, name, count)) return false;

		var item = invMgr.getItemByName(inv, name);
		if (item) {
			item.count += count;
		} else {
			item = { name, count };
			inv.push(item);
		}
		invMgr.removeIfDoesntExist(inv, item);
		return true;
	},

	/**
	 * @param {Item[]} inv
	 * @param {string} name
	 * @param {number} count
	 */
	removeItem(inv, name, count) {
		if (!invMgr.canRemoveItem(inv, name, count)) return false;

		var item = invMgr.getItemByName(inv, name);
		if (item) {
			item.count -= count;
		} else {
			item = { name, count: -count };
			inv.push(item);
		}

		invMgr.removeIfDoesntExist(inv, item);
		return true;
	},
};

////////////////////////// execute commands //////////////////////////

/**
 * @param {ReceivedCommand} cmdData
 */
async function executeReload(cmdData) {
	if (!channelDatabase) {
		bot = cmdData.bot;
		setChannelDatabase();
	} else {
		channelDatabase.list.reset();
	}
	return makeMessage('Rechargement terminé !');
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id_prop
 * @param {string} name_batiment
 */
async function executeCreateBatiment(cmdData, id_prop, name_batiment) {
	if (!name_batiment) {
		return makeError(`Nom invalide du bâtiment : ${name_batiment}`);
	}
	const name = 'b' + name_batiment;

	const md = await getMessageData(name, true);
	if (md.data.proprietaire) return makeError(`Ce bâtiment existe déjà : ${name}`);

	md.data.proprietaire = id_prop;
	await md.save();
	return makeMessage(`Un bâtiment a été créé pour ${id_prop} : ${name}`);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id_prop
 */
async function executeOpen(cmdData, id_prop) {
	const md = await getMessageData(id_prop);

	if (!invMgr.canOpen(md, cmdData.author)) return messages.cantOpen(md);

	const inventory_source = md?.data?.inventaire;

	return new EmbedMaker(
		'',
		`**Inventaire de ${id_prop}**\n` +
			(!inventory_source?.length
				? 'Vide'
				: Object.values(inventory_source)
						.map(i => `${i.count || 1}x ${i.name}`)
						.join('\n'))
	);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id
 * @param {string} item_name
 */
async function executeEdit(cmdData, id, item_name) {
	const md = await getMessageData(id, true);

	if (!invMgr.isPorp(md, cmdData.author)) return messages.cantEdit(md);
	if (!item_name) return messages.badName(item_name);

	const inventory_source = md.data.inventaire;

	inventory_source[0] = { name: item_name, count: 1 };

	md.save();
	return makeMessage('Message modifié !');
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeGive(cmdData, id, item_name, item_count) {
	const count = parseInt(item_count) || 1;
	if (count < 0) return executeRemove(cmdData, id, item_name, -count);

	const md = await getMessageData(id, true);

	if (!invMgr.isPorp(md, cmdData.author)) return messages.cantEdit(md);
	if (!item_name) return messages.badName(item_name);

	const inventory_source = md.data.inventaire;
	var item = invMgr.getItemByName(inventory_source, item_name);

	if (item) {
		if (!invMgr.canAddItem(inventory_source, item_name, count)) return messages.cantAddItem({ name: item_name, count }, id);
		item.count += count;
		// TODO: count = -1 ?
		invMgr.removeIfDoesntExist(inventory_source, item);
	} else {
		item = { name: item_name, count };
		inventory_source.push(item);
	}

	md.save();
	return messages.itemInfo(item, id);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeRemove(cmdData, id, item_name, item_count) {
	const count = parseInt(item_count) || 1;
	if (count < 0) return executeGive(cmdData, id, item_name, -count);

	const md = await getMessageData(id, true);

	if (!invMgr.isPorp(md, cmdData.author)) return messages.cantEdit(md);
	if (!item_name) return messages.badName(item_name);

	const inventory_source = md.data.inventaire;
	const item = invMgr.getItemByName(inventory_source, item_name);

	if (!invMgr.canRemoveItem(inventory_source, item_name, count)) return messages.noItem({ name: item_name, count }, id);
	item.count -= count;
	invMgr.removeIfDoesntExist(inventory_source, item);

	md.save();
	return messages.itemInfo(item, id);
}

/**
 * @param {ReceivedCommand} cmdData
 * @param {string} id_source
 * @param {string} id_target
 * @param {string} item_name
 * @param {string} item_count
 */
async function executeMove(cmdData, id_source, id_target, item_name, item_count) {
	const count = parseInt(item_count) || 1;
	if (count < 0) return executeMove(cmdData, id_target, id_source, item_name, -count);

	const md_source = await getMessageData(id_source, true);
	const md_target = await getMessageData(id_target, true);

	if (!invMgr.isPorp(md_source, cmdData.author) && !invMgr.isPorp(md_target, cmdData.author))
		return makeMessage(`Vous n'etes le propriétaire d'aucun de ces inventaire donc vous ne pouvez pas déplacer les objets`);
	if (!item_name) return messages.badName(item_name);

	const inventory_source = md_source.data.inventaire;
	const inventory_target = md_target.data.inventaire;

	if (!invMgr.canRemoveItem(inventory_source, item_name, count)) {
		return messages.noItem({ name: item_name, count }, id_source);
	}
	if (!invMgr.canAddItem(inventory_target, item_name, count)) {
		return messages.cantAddItem({ name: item_name, count }, id_target);
	}

	invMgr.removeItem(inventory_source, item_name, count);
	invMgr.addItem(inventory_target, item_name, count);

	md_source.save();
	md_target.save();

	const item_source = invMgr.getItemByName(inventory_source, item_name);
	const item_target = invMgr.getItemByName(inventory_target, item_name);
	return makeMessage(
		`Vous avez déplacé ${count}x ${item_name} de ${id_source} vers ${id_target}.\n` +
			messages.itemSmartInfo(item_source, id_source) +
			'\n' +
			messages.itemSmartInfo(item_target, id_target)
	);
}
