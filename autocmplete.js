const thd = require("../schema/tahdeer.js");

module.exports = {
  name: `interactionCreate`,
  once: false,
  run: async (i, bot) => {
    if (!i.isAutocomplete()) return;
    if (i.commandName === "حذف" || i.commandName === "توب"|| i.commandName === "تصفير") {
      const vv = i.options.getFocused();
      const choices = await thd
        .find({ guild: i.guild.id, deleted: false })
        .limit(25);
      const filtered = choices.filter((choice) => choice.title.startsWith(vv));

      await i.respond(
        filtered.map((choice) => ({
          name: `#${choice.channel ? bot.channels.cache.get(choice.channel).name : "#deleted"} - ${choice.title}`,
          value: String(choice.id),
        })),
      );
    }
  },
};
