const Discord = require("discord.js");
const ms = require("ms");
const Pnt = require("../../schema/points.js");

module.exports = {
  name: "تصفير",
  description: "تصفير نقاط مستخدم او الجميع",
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
      name: "نقاط",
      type: 1,
      description: "تصفير نقاط مستخدم او الجميع",
      options: [
        {
          name: "مستخدم",
          type: "USER",
          description: "المستخدم",
          required: false,
        },
        {
          name: "الجميع",
          type: "BOOLEAN",
          description: "حذف الجميع؟",
          required: false,
        },
      ],
    },
  ],
  path: "/reset.js",
  run: async (lb, lbargs, bot, db) => {
    {
      {
        let user = lb.options.getUser("مستخدم");
        let all = lb.options.getBoolean("الجميع");

        if (!user && !all) return lb.reply({ content: "حدد مستخدم او جميع" });
        if (user && all) return lb.reply({ content: "اختر مستخدم او الحمسع" });
        if (user) {
          let puser = await Pnt.findOne({ id: user.id });
          if (!puser)
            return lb.reply({
              content: "هذا المستخدم غير موجود في قاعدة البيانات",
              ephemeral: true,
            });

          let oldpoints = puser.points;
          puser.points = 0;
          await puser.save();
          lb.reply({
            content: `تم تصفير <@${user.id}>\n${oldpoints} --> 0!`,
            ephemeral: true,
          });
        } else if (all == true) {
          await Pnt.deleteMany({});

          lb.reply({ content: "تم حذف جميع النقاط", ephemeral: true });
        } else if (all == false) {
          lb.reply({ content: "يجب ان يكون الخيار مفعل", ephemeral: true });
        }
      }
    }
  },
};
