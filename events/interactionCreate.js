let hastebin = require('hastebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: 'Vous avez déjà démarré un appel.',
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.parentOpened,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `L'appel a été démarré ! <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('ff9600')
          .setAuthor('Département', ' ')
          .setDescription('Choisissez le département que vous souhaitez contacter.')
          .setFooter('Direction Générale des Renseignements Généraux', ' ')
          .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Liste des départements')
            .addOptions([{
                label: 'Ethique',
                value: 'Ethique',
                emoji: { name: '💎​' }
              },
              {
                label: 'Justice Interne',
                value: 'Justice Interne',
                emoji: { name: '⚖️​' }
              },
              {
                label: 'Renseignements',
                value: 'Renseignements',
                emoji: { name: '👓​' }
              },
              {
                label: 'Sécurité Interne',
                value: 'Sécurité Interne',
                emoji: { name: '🔰​' }
              },
              {
                label: 'Affaires Externes',
                value: 'Affaires Externes',
                emoji: { name: '💼' }
              },
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('ff9600')
                  .setAuthor('Ticket', ' ')
                  .setDescription(`<@!${interaction.user.id}> has create a **Ticket** with the reason・ ${i.values[0]}`)
                  .setFooter('Ticket System', ' ')
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Mettre fin à l\'appel')
                    .setEmoji('899745362137477181')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            if (i.values[0] == 'Ethique') {
              c.edit({
                parent: client.config.parentApply
              });
            };
            if (i.values[0] == 'Justice Interne') {
              c.edit({
                parent: client.config.parentSupport
              });
            };
            if (i.values[0] == 'Renseignements') {
              c.edit({
                parent: client.config.parentComplaint
              });
            };
            if (i.values[0] == 'Sécurité Interne') {
              c.edit({
                parent: client.config.parentHosting
              });
            };
            if (i.values[0] == 'Affaires Externes') {
              c.edit({
                parent: client.config.parentPartnership
              });
            };
          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Aucun département n'a été contacté. Fermeture...`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 5000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Mettre fin à l\'appel')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Annuler la fin d\'appel')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: 'Êtes-vous sûr de vouloir mettre fin à l\'appel ?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `L\'appel a été clotûré par <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `terminé-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('ff9600')
                .setAuthor('Appel', ' ')
                .setDescription('```Sauvegarde...```')
                .setFooter('Direction Générale des Renseignements Généraux', ' ')
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Supprimer l\appel')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'Fermeture de l\'appel annulée !',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'Fermeture de l\'appel annulée !',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'Sauvegarde...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('de-DE')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Rien n'a été noté dans l'appel."
        hastebin.createPaste(a, {
            contentType: 'text/plain',
            server: 'https://hastebin.com'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
              .setAuthor('Logs des appels', ' ')
              .setDescription(`📰 Logs des appels \`${chan.id}\` créé par <@!${chan.topic}> et supprimé par <@!${interaction.user.id}>\n\nLogs : [**Cliquer ici pour voir les logs**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            const embed2 = new client.discord.MessageEmbed()
              .setAuthor('Logs des appels', ' ')
              .setDescription(`📰 Logs de votre appel \`${chan.id}\`: [**Cliquer ici pour voir les logs**](${urlToPaste})`)
              .setColor('2f3136')
              .setTimestamp();

            client.channels.cache.get(client.config.logsTicket).send({
              embeds: [embed]
            });
            client.users.cache.get(chan.topic).send({
              embeds: [embed2]
            }).catch(() => {console.log('I cant send it DM')});
            chan.send('Supprimer le salon.');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};
