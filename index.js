import './setup.js';
import './bot/ConsoleLogger.js';

import DiscordBot from './bot/bot.js';
const bot = new DiscordBot(); //id du bot:<@!494587865775341578>

process.bot = bot;

bot.start();
