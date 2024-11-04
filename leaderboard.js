const Discord = require("discord.js");
const ms = require("ms");
const Pnts = require("../../schema/points.js");
const Thdr = require("../../schema/tahdeer.js");

module.exports = {
  name: "توب",
  description: "الاوائل في النقاط/التحضير",
  aliases: [],
  usage: "!leaderboard",
  example: "!leaderboard",
  catg: "mod",
  prms: "top",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "نقاط",
      description: "التصفيةوحسب النقاطر",
      type: "BOOLEAN",
      required: false,
    },
    {
      name: "حضور",
      description: "اختر التحضير",
      type: "STRING",
      required: false,
      autocomplete: true,
    },
  ],
  path: "/leaderboard.js",
  run: async (lb, bot) => {
    let tahdr = await lb.options.getString("حضور");
    let pnts = await lb.options.getBoolean("نقاط");

    if (pnts == true && tahdr)
      return lb.reply({ ephemeral: true, content: "اختر واحدة" });
    if (!pnts && !tahdr)
      return lb.reply({ ephemeral: true, content: "اختر واحدة!" });

    const pageSize = 5;
    const prettyMilliseconds = require("pretty-ms");
    let users;

    if (pnts == true) users = await Pnts.find({});
    if (tahdr) users = await Thdr.findOne({ id: Number(tahdr) });
    if (!users)
      return lb.reply({
        ephemeral: true,
        content: "لا يوجد اعضاء في قاعدة البيانات.",
      });

    let pages;
    if (pnts === true) pages = Math.ceil(users.length / pageSize);
    else pages = Math.ceil(users.top.length / pageSize);
    let page = 1;

    const generateEmbed = (page) => {
      if (pnts === true) users.sort((a, b) => b.points - a.points);
      else users.top.sort((a, b) => b.score - a.score);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      let usersOnPage;
      if (pnts === true) usersOnPage = users.slice(start, end);
      else usersOnPage = users.top.slice(start, end);

      let desc = "";
      const embed = new Discord.MessageEmbed()
        .setTitle(`الاوائل في ${pnts == true ? "النقاط" : "الحضور"}`)
        .setThumbnail(lb.guild.iconURL({ dynamic: true }))
        .setColor(bot.config.embed.color)
        .setFooter({ text: `صفحة ${page} من ${pages}` });

      usersOnPage.forEach((user, index) => {
        if (pnts === true) {
          desc += `\n**${start + index + 1}**. <@${user.id}> ― ${user.points}`;
        } else if (tahdr) {
          desc += `\n**${start + index + 1}**. <@${user.user}> ― ${prettyMilliseconds(user.score)}`;
        }
      });
      embed.setDescription(desc);
      return embed;
    };

    const generateButtons = (page) => {
      const row = new Discord.MessageActionRow();
      if (page > 1) {
        row.addComponents(
          new Discord.MessageButton()
            .setCustomId("prev")
            .setLabel("↲")
            .setStyle("SECONDARY"),
        );
      }
      if (page < pages) {
        row.addComponents(
          new Discord.MessageButton()
            .setCustomId("next")
            .setLabel("↳")
            .setStyle("SECONDARY"),
        );
      }
      return row.components.length > 0 ? row : null;
    };

    const row = generateButtons(page);
    const components = row ? [row] : [];

    const embedMessage = await lb.reply({
      embeds: [generateEmbed(page)],
      components: components,
      fetchReply: true,
    });
    
    // Extend the message lifetime to 5 minutes (300,000 milliseconds)
    setTimeout(() => {
      if (embedMessage.deletable) {
        embedMessage.delete();
      }
    }, 900000); // 15 minutes
    
    // Add the InteractionCollector for handling button interactions
    const collector = embedMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === lb.user.id,
      time: 900000,  // Set to 15 minutes (900000 milliseconds)
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "next") {
          page++;
      } else if (interaction.customId === "prev") {
          page--;
      }
  
      const row = generateButtons(page);
      const components = row ? [row] : [];
  
      // Prevent double updates by checking if interaction is already acknowledged
      if (!interaction.replied && !interaction.deferred) {
          await interaction.update({
              embeds: [generateEmbed(page)],
              components: components,
          });
      } else {
          console.log("Interaction has already been acknowledged.");
      }
  });  

    collector.on("end", async () => {
      const disabledRow = new Discord.MessageActionRow().addComponents(
        new Discord.MessageButton()
          .setCustomId("prev")
          .setLabel("↲")
          .setStyle("SECONDARY")
          .setDisabled(true),
        new Discord.MessageButton()
          .setCustomId("next")
          .setLabel("↳")
          .setStyle("SECONDARY")
          .setDisabled(true),
      );

      await embedMessage
        .edit({
          components: [disabledRow],
        })
        .catch(() => {});
    });
  },
};
