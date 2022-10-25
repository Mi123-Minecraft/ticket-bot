const {
  SlashCommandBuilder
} = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Retirer un utilisateur à un appel.')
    .addUserOption(option =>
      option.setName('target')
      .setDescription('Ajouter un utilisateur à un appel.')
      .setRequired(true)),
  async execute(interaction, client) {
    const chan = client.channels.cache.get(interaction.channelId);
    const user = interaction.options.getUser('target');

    if (chan.name.includes('ticket')) {
      chan.edit({
        permissionOverwrites: [{
          id: user,
          null: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
        },
        {
          id: interaction.guild.roles.everyone,
          deny: ['VIEW_CHANNEL'],
        },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
      ],
      }).then(async () => {
        interaction.reply({
          content: `<@${user.id}> a été retiré de cet appel !`
        });
      });
    } else {
      interaction.reply({
        content: 'Erreur : Vous n\'êtes pas dans un appel !',
        ephemeral: true
      });
    };
  },
};
