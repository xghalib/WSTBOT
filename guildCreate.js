module.exports = {
  name: `guildCreate`,
  once: false,
  run: async (guild, bot) => {
    if (bot.config.servers.includes(guild.id)) return;

    let chx = guild.channels.cache
      .filter((chx) => chx.type === "GUILD_TEXT")
      .find((x) => x.position === 0);

    if (chx && chx.permissionsFor(guild.me).has("SEND_MESSAGES")) {
      chx.send("هذا البوت لا يمكنه دخول هذا السيرفر جاري الخروج");
    } else {
      console.log(
        "Bot does not have permission to send messages in this channel.",
      );
    }
    guild.leave();
  },
};
