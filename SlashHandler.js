const prettyMilliseconds = require("pretty-ms");
const ms = require("ms");
const fs = require("fs");
const config = require("./config.json");
const Discord = require("discord.js");
const Login = require('./schema/users.js');

module.exports = {
  async run(bot, db) {
    bot.slash = new Discord.Collection();
    bot.cooldown = new Discord.Collection();
    bot.config = config;

    let arraySC = [];
    const folders = fs.readdirSync("./SlashCommands");
    for (const folder of folders) {
      const files = fs
        .readdirSync(`./SlashCommands/${folder}`)
        .filter((file) => file.endsWith(".js"));
      for (const file of files) {
        const command = require(`./SlashCommands/${folder}/${file}`);
        bot.slash.set(command.name, command);
        arraySC.push(command);
      }
    }

    // Handle subcommands
    arraySC.forEach((cmd) => {
      if (cmd.type === 1 && cmd.parent) {
        const parentCmd = bot.slash.get(cmd.parent);
        if (parentCmd) {
          if (!parentCmd.options) parentCmd.options = [];
          if (!cmd.options) cmd.options = [];
          parentCmd.options.push({
            name: cmd.name,
            description: cmd.description,
            type: 1,
            options: cmd.options,
            run: cmd.run,
          });
          arraySC = arraySC.filter((c) => c.name !== cmd.name);
        }
      }
    });

    bot.on("ready", () => {
      bot.application?.commands.set(arraySC);
      console.log(
        `\x1b[1m\x1b[32m✅ Slash commands loaded successfully.\x1b[0m`,
      );
    });

    bot.on("interactionCreate", async (lb) => {
      if (!lb.isCommand()) return;
// Force logout command logic
if (lb.commandName === "force_logout") {
  const userId = lb.options.getUser('user').id;  // Get the user ID from the slash command
  const user = await Login.findOne({ id: userId });  // Query the user in the Login schema

  // Check if the user is logged in
  if (user && user.isLoggedIn !== "0") {
      user.isLoggedIn = "0";  // Forcefully log the user out
      await user.save();
      return lb.reply({
          content: `User <@${userId}> has been forcefully logged out.`,
          ephemeral: true,  // Show only to the command issuer
      });
  } else {
      return lb.reply({
          content: `User <@${userId}> is not logged in.`,
          ephemeral: true,
      });
  }
}

      const command = bot.slash.get(lb.commandName);
      if (!command) return;

      let cmdToRun = command;
      const subCommandName = lb.options.getSubcommand(false);
      if (subCommandName) {
        const subCommand = command.options.find(
          (opt) => opt.name === subCommandName,
        );
        if (subCommand && subCommand.run) {
          cmdToRun = subCommand;
        }
      }

      try {
        if (command.permissions?.bot?.length) {
          const botPerms = lb.channel.permissionsFor(lb.guild.members.me);
          if (
            !botPerms ||
            !command.permissions.bot.every((p) => botPerms.has(p))
          ) {
            const missingPerms = command.permissions.bot.filter(
              (p) => !botPerms.has(p),
            );
            return lb.reply({
              content: `**Bot can't execute this command without \`${missingPerms.join("`, `")}\` permission(s)**`,
              ephemeral: true,
            });
          }
        }

        if (command.permissions?.user?.length) {
          const userPerms = lb.channel.permissionsFor(lb.user);
          if (
            !userPerms ||
            !command.permissions.user.every((p) => userPerms.has(p))
          ) {
            const missingPerms = command.permissions.user.filter(
              (p) => !userPerms.has(p),
            );
            return lb.reply({
              content: `**You don't have \`${missingPerms.join("`, `")}\` permission(s)**`,
              ephemeral: true,
            });
          }
        }

        if (!bot.cooldown.has(command.name)) {
          bot.cooldown.set(command.name, new Discord.Collection());
        }

        const now = Date.now();
        const timestamps = bot.cooldown.get(command.name);
        const cooldownAmount = ms(command.cooldown || "0s");

        if (timestamps.has(lb.user.id)) {
          const expirationTime = timestamps.get(lb.user.id) + cooldownAmount;
          if (now < expirationTime) {
            const timeLeft = expirationTime - now;
            return lb.reply({
              content: `**You are on cooldown for ${prettyMilliseconds(timeLeft, { verbose: true })}**`,
              ephemeral: true,
            });
          }
        }

        timestamps.set(lb.user.id, now);
        setTimeout(() => timestamps.delete(lb.user.id), cooldownAmount);

        if (cmdToRun.catg === "mod") {
          let modroles = bot.config.roles[cmdToRun.prms];
          if (!modroles) modroles = bot.config.roles.other;
          let array1 = modroles.map(
            (r) => lb.guild.roles.cache.get(r)?.name || "noroleisdefined",
          );
          let array3 = bot.config.roles.owners.map(
            (r) => lb.guild.roles.cache.get(r)?.name || "noroleisdefined",
          );
          let array2 = lb.member.roles.cache.map((r) => r.name);

          if (
            array1.some((item) => array2.includes(item)) ||
            array3.some((item) => array2.includes(item))
          ) {
            await cmdToRun.run(lb, bot, db, Discord);
          } else {
            lb.reply({
              content: "لا يوجد لديك الصلاحية الكافية.",
              ephemeral: true,
            });
          }
        } else {
          await cmdToRun.run(lb, bot, db, Discord);
        }
      } catch (error) {
        console.error(error);
        if (lb.deferred) {
          await lb.editReply({
            content: `يوجد مشكلة، تواصل  مع المطور لحلها\n${error}`,
            ephemeral: true,
          });
        } else {
          await lb.reply({
            content: `يوجد مشكلة، تواصل  مع المطور لحلها\n${error}`,
            ephemeral: true,
          });
        }
      }
    });
  },
};
