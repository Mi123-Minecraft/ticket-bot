require('dotenv').config();
const keep_alive = require('./keep_alive.js');
const fs = require('fs');
const {
  Client,
  Collection,
  Intents
} = require('discord.js');
const config = require('./config.json');
const {
  REST
} = require('@discordjs/rest');
const {
  Routes
} = require('discord-api-types/v9');
const {
  clientId
} = require('./config.json');
const t = process.env['TOKEN'];

const slashcommands = [];
const slashcommandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of slashcommandFiles) {
  const command = require(`./commands/${file}`);
  slashcommands.push(command.data.toJSON());
}

const rest = new REST({
  version: '9'
}).setToken(t);

rest.put(Routes.applicationCommands(clientId), {
  body: slashcommands
})
  .then(() => console.log('Successfully registered application commands.'))
  .catch(console.error);

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

const Discord = require('discord.js');
client.discord = Discord;
client.config = config;

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
};

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  client.on(event.name, (...args) => event.execute(...args, client));
};

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;


  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, config);
  } catch (error) {
    console.error(error);
    return interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true
    });
  };
});

client.on("ready", () =>{
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setPresence({
      status: "dnd",
      game: {
          name: "la maintenance.",
          type: "WATCHING",
      }
  });
});

client.login(process.env['TOKEN']);