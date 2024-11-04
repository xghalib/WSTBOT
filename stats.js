const Discord = require("discord.js");
const ms = require("ms");
const Users = require("../../schema/users.js");
const Pnts = require("../../schema/points.js");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
  name: "بيانات",
  description: "احصل على بيانات مستخدم",
  aliases: [],
  usage: "!stats",
  example: "!stats",
  catg: "mod",
  prms: "other",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "مستخدم",
      type: "USER",
      description: "احصل على معلومات المستخدم",
      required: true,
    },
  ],
  path: "/stats.js",
  run: async (lb, bot) => {
    await lb.deferReply({ ephemeral: true });
    let user = lb.options.getMember("مستخدم");
    let points = await Pnts.findOne({ id: user.id });
    let streak = await Users.findOne({ id: user.id });

    if (!streak && !points) return await lb.editReply("لا يوجد احصائيات لعرضها");
    if (!points) points = { points: "0" };
    if (!streak) streak = { isLoggedIn: "0", lastlogin: "None", total: 0 };

    let embd = new Discord.MessageEmbed()
      .setTitle(user.displayName)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setDescription(
        `**ID**: ${user.id}\n\n**Current login:** ${user.isLoggedIn === "0" ? "None" : user.isLoggedIn || "None"}\n**Last Login**: ${streak?.lastlogin || "None"}\n**Streak:** ${streak?.total ? prettyMilliseconds(streak.total, { verbose: true }) : "0"}\n**Points**: ${points?.points || 0}`,
      )
      .setColor(bot.config.embed.color);

    await lb.editReply({ embeds: [embd], ephemeral: false });
  },
};
