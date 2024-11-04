const Discord = require("discord.js");
const Tahdeer = require("../../schema/tahdeer.js");
const Users = require("../../schema/users.js");

module.exports = {
  name: "التحضير",
  parent: "تصفير",
  type: 1,
  description: "تصفير تحضير شخص أو الجميع",
  aliases: [],
  usage: "!reset",
  example: "!reset",
  catg: "mod",
  prms: "tasfeer",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "التحضير",
      type: "STRING",
      description: "ايدي التحضير",
      required: true,
      autocomplete: true,
    },
    {
      name: "مستخدم",
      type: "USER",
      description: "المستخدم",
      required: false,
    },
    {
      name: "الكل",
      type: "BOOLEAN",
      description: "تصفير الكل؟",
      required: false,
    },
  ],
  path: "/reset.js",
  run: async (lb) => {
    // Immediately defer reply to prevent interaction expiration
    await lb.deferReply({ ephemeral: true });

    const user = lb.options.getUser("مستخدم");
    const thdr = lb.options.getString("التحضير");
    const all = lb.options.getBoolean("الكل");

    const tahder = await Tahdeer.findOne({ id: thdr });
    if (!tahder) {
      return lb.editReply("❌ لا يوجد تحضير بهذا الايدي.");
    }

    let top = tahder.top || [];

    // Reset specific user
    if (user) {
      let userData = await Users.findOne({ id: user.id });

      userData.total = 0;
      await userData.save();

      top = top.filter((item) => item.user !== user.id);
      tahder.top = top;
      await tahder.save();

      await lb.editReply(`✅ تم تصفير ${user} من التحضير`);

    } else if (all === true) {
      const allUsers = await Users.find({});

      for (let u of allUsers) {
        u.total = 0;
        await u.save();
      }

      tahder.top = [];
      await tahder.save();

      await lb.editReply("✅ تم تصفير جميع المستخدمين.");
    }
  },
};