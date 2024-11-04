const Discord = require("discord.js");
const ms = require("ms");
const Tahdeer = require("../../schema/tahdeer.js");

module.exports = {
  name: "حذف",
  description: "حذف تحضير",
  aliases: [],
  usage: "!new",
  example: "!new",
  catg: "mod",
  prms: "create",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "تحضير",
      description: "حذف جلسة",
      type: 1,
      options: [
        {
          name: "ايدي",
          type: "STRING",
          description: "ايدي",
          autocomplete: true,
          required: true,
        },
      ],
    },
  ],
  path: "/new.js",
  run: async (lb, bot, db) => {
    {
      {
        let id = lb.options.getString("ايدي");
        let thdr = await Tahdeer.findOne({ id: Number(id) });

        if (!thdr)
          return lb.reply({ content: "هذا الايدي غير موجود", ephemeral: true });

        let msg = await lb.channel.messages.fetch(thdr.msg);
        thdr.deleted = true;
        thdr.save();

        lb.reply({ content: "تم حذف هذا التحضير", ephemeral: true });

        const logembed = new Discord.MessageEmbed()
          .setColor(bot.config.log_embed.color)
          .setDescription(
            bot.config.events.delete_session
              .replace("{user}", lb.user)
              .replace("{title}", msg.embeds[0].title),
          )
          .setFooter({
            text: bot.config.log_embed.footer.replace(
              "{user}",
              lb.user.username,
            ),
            iconURL: lb.user.displayAvatarURL({ dynamic: true }),
          })
          .setAuthor({
            name:
              bot.config.log_embed?.author
                .replaceAll("{guild}", lb.guild.name)
                .replaceAll("{user}", lb.user.username) || `${lb.guild.name}`,
            iconURL: lb.guild.iconURL({ dynamic: true }),
          });

        if (bot.config.log_embed.title)
          logembed.setTitle(bot.config.log_embed.title);
        if (bot.config.log_embed.thumbnail === true)
          logembed.setThumbnail(lb.user.displayAvatarURL({ dynamic: true }));

        // Reset the isLoggedIn state for users linked to this session
        let usersToUpdate = await db.models.User.find({ isLoggedIn: id });
        for (let user of usersToUpdate) {
          user.isLoggedIn = "0";  // Reset login state to logged out
          await user.save();
        }
        console.log('Users logged out from deleted session');

        if (!thdr.log) {
          await lb.guild.channels.cache
            .get(bot.config.channels.log)
            .send({ embeds: [logembed] });
        } else {
          await lb.guild.channels.cache
            .get(thdr.log)
            .send({ embeds: [logembed] });
        }

        try {
          let msg = await lb.channel.messages.fetch(thdr.msg);
          if (msg) await msg.delete();
        } catch (err) {
          console.error("تعذر العثور على الرسالة أو حذفها:", err);
          lb.reply({ content: "تعذر العثور على الرسالة المرتبطة بهذه الجلسة أو حذفها", ephemeral: true });
        }
      }
    }
  },
};
