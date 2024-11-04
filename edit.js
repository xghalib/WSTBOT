const Discord = require("discord.js");
const ms = require("ms");
const Pnt = require("../../schema/points.js");

module.exports = {
  name: "تعديل",
  description: "تعديل نقاط مستخدم",
  aliases: [],
  usage: "!edit",
  example: "!edit",
  catg: "mod",
  prms: "edit",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "النقاط",
      description: "تعديل نقاط مستخدم",
      type: 1,
      options: [
        {
          name: "مستخدم",
          type: "USER",
          description: "المستخدم",
          required: true,
        },
        {
          name: "نقاط",
          type: "NUMBER",
          description: "تعديل النقاط",
          required: true,
        },
      ],
    },
  ],
  path: "/edit.js",
  run: async (lb, lbargs, bot, db) => {
    {
      {
        let points = lb.options.getNumber("نقاط");
        let user = lb.options.getUser("مستخدم");

        let puser = await Pnt.findOne({ id: user.id });
        if (!puser)
          return lb.repl({
            content: "هذا المستخدم غير موجود في قاعدة البيانات",
            ephemeral: true,
          });
        let oldpoints = puser.points;
        puser.points = points;
        await puser.save();
        lb.reply({
          content: "تم تغيير النقاط\n" + `${oldpoints} --> ${points}!`,
          ephemeral: true,
        });
      }
    }
  },
};
