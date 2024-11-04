const Tahdeer = require("../schema/tahdeer.js");
const User = require("../schema/users.js");
const Discord = require("discord.js");
module.exports = {
  name: `interactionCreate`,
  once: false,
  run: async (i, bot) => {
    if (i.isSelectMenu()) {
      if (i.customId.startsWith("slct_")) {
        if (
          i.member.roles.cache.hasAny(bot.config.roles.owners) ||
          i.member.roles.cache.hasAny(bot.config.roles.delete)
        ) {
          return i.reply({ content: bot.config.not_a_mod, ephemeral: true });
        }
        const logembed = new Discord.MessageEmbed()
          .setColor(bot.config.log_embed.color)
          //.setTitle(bot.config.log_embed.title)
          // .setThumbnail(i.user.displayAvatarURL())
          .setFooter({
            text: bot.config.log_embed.footer.replace(
              "{user}",
              i.user.username,
            ),
            iconURL: i.user.displayAvatarURL({ dynamic: true }),
          })
          .setAuthor({
            name:
              bot.config.log_embed?.author
                .replaceAll("{guild}", i.guild.name)
                .replaceAll("{user}", i.user.username) || `${i.guild.name}`,
            iconURL: i.guild.iconURL({ dynamic: true }),
          });
        if (bot.config.log_embed.title)
          logembed.setTitle(bot.config.log_embed.title);
        if (bot.config.log_embed.thumbnail === true)
          logembed.setThumbnail(i.user.displayAvatarURL({ dynamic: true }));

        let id = i.customId.replace("slct_", "");
        let rmvid = i.values[0];

        let thdr = await Tahdeer.findOne({ id: id });

        let editedmm = thdr.members.filter((obj) => obj.id !== rmvid);
        thdr.members = editedmm;
        await thdr.save();

        let msg = await i.channel.messages.fetch(thdr.msg);
        let usermap = thdr.members
          .filter((u) => !u.total)
          .map((u) => `<@${u.id}> ― <t:${u.at}:R>`)
          .join("\n");
        let mbd = new Discord.MessageEmbed(msg.embeds[0]).setDescription(
          usermap,
        );
        await msg.edit({
          embeds: [mbd],
        });

        let user = await User.findOne({ id: rmvid });
        user.isLoggedIn = "0";
        await user.save();
        i.reply({ content: "تم حذف هذا العضو", ephemeral: true });
        logembed.setDescription(
          bot.config.events.remove
            .replace("{actor}", i.user)
            .replace("{user}", "<@" + rmvid + ">")
            .replace("{title}", msg.embeds[0].title),
        );
        if (!thdr.log) {
          await i.guild.channels.cache
            .get(bot.config.channels.log)
            .send({ embeds: [logembed] });
        } else {
          await i.guild.channels.cache
            .get(thdr.log)
            .send({ embeds: [logembed] });
        }
      }
    }
  },
};
