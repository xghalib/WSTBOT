const COOLDOWN_PERIOD = 10000;  // Cooldown period set to 10 seconds
const userActionTimestamps = {};  // Track the last action time for each user
const prettyMilliseconds = require("pretty-ms");
const tahdeer = require("../schema/tahdeer.js");
const users = require("../schema/users.js");
const ms = require("ms");
const Discord = require("discord.js");
const Tahdeer = require("../schema/tahdeer.js");

module.exports = {
  name: `interactionCreate`,
  once: false,
  run: async (i, bot) => {
    const logembed = new Discord.MessageEmbed()
      .setColor(bot.config.log_embed.color)
      //.setTitle(bot.config.log_embed.title)
      //.setThumbnail(i.user.displayAvatarURL())
      .setFooter({
        text: bot.config.log_embed.footer.replace("{user}", i.user.username),
        iconURL: i.user.displayAvatarURL({ dynamic: true }),
      })
      .setAuthor({
        name:
          bot.config.log_embed?.author
            .replaceAll("{guild}", i.guild.name)
            .replaceAll("{user}", i.user.username) || `${i.guild.name}`,
        iconURL: i.guild.iconURL({ dynamic: true }),
      });

    if (bot.config.log_embed.thumbnail == true)
      logembed.setThumbnail(i.user.displayAvatarURL({ dynamic: true }));
    if (bot.config.log_embed.title)
      logembed.setTitle(bot.config.log_embed.title);

    if (!i.isButton()) return;
    
    const userId = i.user.id;
    const currentTime = Date.now();
    const lastActionTime = userActionTimestamps[userId] || 0;

    // Skip cooldown for leaderboard interactions based on customId
if (!i.customId || (!i.customId.startsWith("leaderboard") && !i.customId.includes("next") && !i.customId.includes("prev"))) {
  if (currentTime - lastActionTime < COOLDOWN_PERIOD) {
      return i.reply({ content: "يرجى الانتظار قبل محاولة تسجيل الدخول أو الخروج مرة أخرى.", ephemeral: true });
  }

  // Update the last action timestamp for login/logout cooldowns
  userActionTimestamps[userId] = currentTime;
}

    if (i.customId.startsWith("log_")) {
    
      await i.deferReply({ ephemeral: true });

      let tahder = await tahdeer.findOne({
        id: i.customId.replace("log_", ""),
      });

      const user = await users.findOne({ id: i.user.id });

      if (!user) {
        let user = new users({
            id: i.user.id,
            isLoggedIn: "0",  // Default to not logged in
            total: 0,
            lastlogin: "",
            history: [],
        });
        await user.save();
    
        // Check role before logging in
        if (tahder.role && !i.member.roles.cache.has(tahder.role)) {
            return i.editReply({
                content: bot.config.not_allowed.replace("{role}", `<@&${tahder.role}>`),
            });
        }
    
        // Only mark as logged in after passing role check
        user.isLoggedIn = i.customId.replace("log_", "");
        await user.save();
    } else {
        if (user.isLoggedIn == tahder.id) {
            return i.editReply({
                content: bot.config.already_logged,
            });
        }
    
        // Ensure role check happens before login
        if (tahder.role && !i.member.roles.cache.has(tahder.role)) {
            return i.editReply({
                content: bot.config.not_allowed.replace("{role}", `<@&${tahder.role}>`),
            });
        }
    
        user.isLoggedIn = i.customId.replace("log_", "");
        await user.save();
    }    

   // Ensure tahder exists before accessing members
if (!tahder) {
  console.error("Error: tahder is undefined.");
  return i.editReply({ content: "An error occurred while logging in.", ephemeral: true });
}

// Ensure tahder.members is an array (initialize it if needed)
if (!Array.isArray(tahder.members)) {
  tahder.members = [];  // Initialize 'members' as an empty array if undefined
}

// Now safely add the new member
tahder.members.push({
  username: i.user.username,
  id: i.user.id,
  at: Math.floor(Date.now() / 1000),  // Store current timestamp for 'at'
  points: 0,
});

try {
  // Save the updated tahder document
  await tahder.save();
  console.log('Tahder document updated successfully');
} catch (error) {
  console.error("Error saving the tahder document:", error);
  return i.editReply({ content: "Failed to update session data. Please try again later.", ephemeral: true });
}

      let usermap = tahder.members
        .filter((u) => !u.total)
        .map((u) => `<@${u.id}> ― <t:${u.at}:R>`);
      let rmsg = await i.channel.messages.fetch(tahder.msg);
      let mbd = new Discord.MessageEmbed()
        .setTitle(rmsg.embeds[0].title)
        .setColor(bot.config.embed.color)
        .setDescription(usermap.join("\n"));
      await rmsg.edit({ embeds: [mbd] });

      logembed.setDescription(
        bot.config.events.login
          .replace("{user}", i.user)
          .replace("{title}", rmsg.embeds[0].title),
      );

      if (tahder.log) {
        await i.guild.channels.cache
          .get(tahder.log)
          .send({ embeds: [logembed] });
      } else {
        await i.guild.channels.cache
          .get(bot.config.channels.log)
          .send({ embeds: [logembed] });
      }
      await i.editReply({ content: bot.config.login_message, ephemeral: true });
    } else if (i.customId.startsWith("out_")) {
      await i.deferReply({ ephemeral: true });
      let usrt = await users.findOne({ id: i.user.id });
      if (!usrt || usrt.isLoggedIn === "0")
        return i.editReply({ content: "انت غير مسجل", ephemeral: true });

      let tid = i.customId.replace("out_", "");

      let curr = await tahdeer.findOne({ id: tid });

// التحقق من وجود المستخدم (usr) قبل استخدامه
let usr = curr.members.find((m) => m.id == i.user.id);

if (!usr) {
    return i.editReply({ content: "حدث خطأ أثناء تسجيل الخروج. لم يتم العثور على المستخدم في الجلسة.", ephemeral: true });
}

// إضافة بيانات الدخول والخروج للمستخدم
usrt.history.push({
    login: usr.at,
    logout: Math.floor(Date.now() / 1000),
});

      let totalSeconds = 0;
      const duration = Math.floor(Date.now() / 1000) - usr.at;
      totalSeconds += duration;

      let scs = Math.floor(Date.now() / 1000) - usr.at;

      let hours = Math.floor(totalSeconds / 3600);
      let minutes = Math.floor((totalSeconds % 3600) / 60);
      let seconds = totalSeconds % 60;

      usr.total = bot.config.timeformat
        .replaceAll("{h}", hours)
        .replaceAll("{m}", minutes)
        .replaceAll("{s}", seconds);
      usrt.total = scs * 1000 + usrt.total;
      usrt.isLoggedIn = "0";

      curr.members = curr.members.filter((m) => m.id !== i.user.id);

      curr.markModified("members");

      let objIndex = curr.top.findIndex((obj) => obj.user === i.user.id);

      if (objIndex !== -1) {
        curr.top[objIndex].score += scs * 1000;
      } else {
        curr.top.push({ user: i.user.id, score: scs * 1000 });
      }

      curr.markModified("top");
      await curr.save();
      await usrt.save();
      let usermap = curr.members
        .filter((u) => !u.total)
        .map((u) => `<@${u.id}> ― <t:${u.at}:R>`);

      let rmsg = await i.channel.messages.fetch(curr.msg);

      let mbd = new Discord.MessageEmbed()
        .setTitle(rmsg.embeds[0].title)
        .setColor(bot.config.embed.color)
        .setDescription(
          usermap.join("\n") || bot.config?.embed.desc || "enter now",
        );
      await rmsg.edit({ embeds: [mbd] });

      usrt.lastlogin = rmsg.embeds[0].title;
      await usrt.save();

      const totalHours = Math.floor(totalSeconds / 3600);
      const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
      const totalSecondsLeft = totalSeconds % 60;

      let totaltime = bot.config.timeformat
        .replaceAll("{h}", totalHours)
        .replaceAll("{m}", totalMinutes)
        .replaceAll("{s}", totalSecondsLeft);

      logembed.setDescription(
        bot.config.events.logout
          .replace("{user}", i.user)
          .replace("{title}", rmsg.embeds[0].title)
          .replace("{time}", totaltime),
      );

      console.log(curr.top);
      if (curr.log) {
        await i.guild.channels.cache.get(curr.log).send({ embeds: [logembed] });
      } else {
        await i.guild.channels.cache
          .get(bot.config.channels.log)
          .send({ embeds: [logembed] });
      }

      await i.editReply({
        content: bot.config.logout_message,
        ephemeral: true,
      });
    } else if (i.customId.startsWith("del")) {
      await i.deferReply({ ephemeral: true });
      let mod = bot.config.roles.delete;
      if (!mod.some((ide) => i.member.roles.cache.has(ide)))
        return i.editReply({
          content: "ليس لديك صلاحية.",
          ephemeral: true,
        });
      let id = i.customId.replace("del_", "");

      let thdrr = await tahdeer.findOne({ id: id });

      if (thdrr.members.length == 0 || !thdrr)
        return i.editReply({
          content: "لا يوجد اعضاء لحذفهم",
          ephemeral: true,
        });
      let dropmenu = new Discord.MessageActionRow().addComponents(
        new Discord.MessageSelectMenu()
          .setPlaceholder("قم باختيار عضو لحذفه")
          .setCustomId("slct_" + id)
          .addOptions(
            thdrr.members
              .filter((u) => !u.total)
              .map((u) => ({
                label: u.username,
                description: "―",
                value: u.id,
              })),
          ),
      );

      i.editReply({
        content: "اختر من تريد حذفه",
        components: [dropmenu],
        ephemeral: true,
      });
    }
  },
};
