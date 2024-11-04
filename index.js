const Discord = require("discord.js");
require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");

mongoose
  .connect(process.env.MONGO_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => console.log("\x1b[4m\x1b[36m🟢 Database connected\x1b[0m"))
  .catch((err) =>
    console.error("\x1b[4m\x1b[31m🔴 Database connection error:\x1b[0m", err),
  );

const bot = new Discord.Client({ intents: 32767 });
bot.config = require("./config.json");
const Login = require("./schema/users.js");
const Tahdeer = require("./schema/tahdeer.js");

bot.on("ready", async () => {
  console.log(`\x1b[36m󱚣 Logged in as ${bot.user.tag}\x1b[0m`);
  bot.user.setPresence({
    activities: [{ name: 'World Star RP', type: 'PLAYING' }],
    status: 'online'
  });
  console.log('Bot status set to Playing World Star RP.');  

  // INFO: ONLY FOR DEBUGGING, COMMENT IT
// await Tahdeer.deleteMany({});
// await Login.deleteMany({});

  // Leave if not recognized
  bot.guilds.cache.forEach((gld) => {
    // console.log(gld);
    if (!bot.config.servers.includes(gld.id)) {
      gld.leave();
    }
  });
  // Reminder
  const remindUsers = async () => {
    fs.readFile("./config.json", "utf8", (err, data) => {
      if (err) {
        console.error("Error reading config file:", err);
        return;
      }

      bot.config = JSON.parse(data);

      if (bot.config.time === 0 || bot.config.time === -1) {
        return;
      }

      Login.find({}).then((users) => {
        users.forEach(async (u) => {
          if (u.isLoggedIn !== "0") {
            const embed = new Discord.MessageEmbed()
              .setTitle(bot.config.reminder_embed.title || "تذكير")
              .setColor(bot.config.reminder_embed.color)
              .setDescription(
                bot.config.reminder_embed.description ||
                  "لا تنسى تسجيل الخروج!",
              );

            const user = bot.users.cache.get(u.id);
            if (user) {
              await user.send({ embeds: [embed] });
            }
          }
        });

        setTimeout(remindUsers, bot.config.time);
        console.log(
          "\x1b[32m⏳ Next reminder scheduled in:\x1b[0m",
          bot.config.time,
        );
      });
    });
  };

  remindUsers();
});

bot.on("interactionCreate", async (lb) => {
  if (!lb.isCommand()) return;

  const command = lb.commandName;

  if (command === "force_logout") {
    const userId = lb.options.getUser('user').id;  // Get the user ID from the command
    const user = await Login.findOne({ id: userId });

    if (user && user.isLoggedIn !== "0") {
        user.isLoggedIn = "0";  // Forcefully log the user out
        await user.save();
        return lb.reply({
            content: `User <@${userId}> has been forcefully logged out.`,
            ephemeral: true,  // Show the response only to the command issuer
        });
    } else {
        return lb.reply({
            content: `User <@${userId}> is not logged in.`,
            ephemeral: true,
        });
    }
  }
});

require("./SlashHandler.js").run(bot);
require("./EventHandler.js").run(bot);

process.on("unhandledRejection", (err) => {
  console.error("\x1b[33m⚠️ Unhandled rejection:\x1b[0m", err);
});

process.on("uncaughtException", (err) => {
  console.error("\x1b[33m⚠️ Uncaught exception:\x1b[0m", err);
});
const ownerId = "871484978440052737";  // Replace with your Discord user ID

process.on("unhandledRejection", async (error) => {
  try {
    const owner = await bot.users.fetch(ownerId);
    const embed = new Discord.MessageEmbed()
      .setTitle("Unhandled Rejection")
      .setColor("RED")
      .setDescription(`\`\`\`${error.message}\`\`\``)
      .setTimestamp();
    await owner.send({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to send DM for unhandled rejection:", err);
  }
});

process.on("uncaughtException", async (error) => {
  try {
    const owner = await bot.users.fetch(ownerId);
    const embed = new Discord.MessageEmbed()
      .setTitle("Uncaught Exception")
      .setColor("RED")
      .setDescription(`\`\`\`${error.stack}\`\`\``)
      .setTimestamp();
    await owner.send({ embeds: [embed] });
  } catch (err) {
    console.error("Failed to send DM for uncaught exception:", err);
  }
});

bot.login();