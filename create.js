const users = require("../../schema/users.js");
const Tahdeer = require("../../schema/tahdeer.js");

async function newuuid() {
  let tahder = await Tahdeer.findOne().sort({ created_at: -1 });
  if (!tahder) return 1;
  else return tahder.id + 1;
}

const Discord = require("discord.js");
const ms = require("ms");
const { v4: uuidv4 } = require("uuid");

module.exports = {
  name: "تحضير",
  description: "تحضير جديد",
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
      name: "جديد",
      description: "تحضير جديد",
      type: 1,
      options: [
        {
          name: "الروم",
          type: "CHANNEL",
          description: "اختر روم",
          required: true,
        },
        {
          name: "رتبة",
          type: "ROLE",
          description: "اختار الرتبة اللذي تمنحهم الدخول",
          required: true,
        },
        {
          name: "لوق",
          type: "CHANNEL",
          description: "روم اللوق",
          required: true,
        },
        {
          name: "عنوان",
          type: "STRING",
          description: "عنوان التحضير",
          required: false,
        },
      ],
    },
  ],
  path: "/new.js",
  run: async (lb, bot, db) => {
    {
      {
        let title = lb.options.getString("عنوان");
        let channel = lb.options.getChannel("الروم");
        let role = lb.options.getRole("رتبة");
        let logChannel = lb.options.getChannel("لوق");
        let uuid = await newuuid();

        if (await Tahdeer.findOne({ channel: channel.id, deleted: false }))
          return lb.reply({
            content: "لا يمكن انشاء اكثر من تحضير في نفس الروم",
            ephemeral: true,
          });

        let embed = new Discord.MessageEmbed()
          .setTitle(title || "تحضير جديد")
          .setColor(bot.config.embed?.color || "YELLOW")
          .setDescription(bot.config?.embed.desc || "التحضير");

        let acr = new Discord.MessageActionRow().addComponents(
          new Discord.MessageButton()
            .setLabel(bot.config.buttons.login.label || "Login")
            .setStyle(bot.config.buttons.login.style || "PRIMARY")
            .setCustomId("log_" + uuid),

          new Discord.MessageButton()
            .setLabel(bot.config.buttons.logout.label || "Log out")
            .setStyle(bot.config.buttons.logout.style || "SECONDARY")
            .setCustomId("out_" + uuid),

          new Discord.MessageButton()
            .setLabel(bot.config.buttons.delete.label || "Remove user")
            .setStyle(bot.config.buttons.delete.style || "DANGER")
            .setCustomId("del_" + uuid),
        );

        lb.guild.channels.cache
          .get(channel.id)
          .send({ embeds: [embed], components: [acr] })
          .then(async (msg) => {
            let thdr = new Tahdeer({
              id: uuid,
              channel: channel ? channel.id : lb.channel.id,
              title: title ? title : uuid,
              members: [],
              top: [],
              deleted: false,
              msg: msg.id,
              role: role.id,
              log: logChannel?.id,
              guild: lb.guild.id,
            });
            lb.reply({
              content: "تم الانشاءو الايدي:`" + uuid + "`",
              ephemeral: true,
            });
            await thdr.save();
          });
      }
    }
  },
};
