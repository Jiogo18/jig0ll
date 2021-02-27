import dotenv from 'dotenv'; dotenv.config();
process.env.WIPOnly = process.argv.includes("WIP") ? true : '';
process.env.HEROKU = process.execPath.includes('heroku') ? true : '';

import 'colors';//colors for everyone ! (don't remove)


import DiscordBot from './bot/bot.js';
const bot = new DiscordBot();//id du bot:<@!494587865775341578>


bot.start();



import web from './web/app.js';
web.start();
