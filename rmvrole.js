const Discord = require("discord.js");
const ms = require("ms");
const prettyMilliseconds = require("pretty-ms");
const fs = require("fs");

const updateConfigRemove = (cmd, role, lb) => {
  fs.readFile("./config.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return lb.editReply({
        content: "حدث خطا اثناء قراءة ملف الكونفج",
      });
    }

    const json = JSON.parse(data);
    const index = json.roles[cmd].indexOf(role.id);
    if (index > -1) {
      json.roles[cmd].splice(index, 1);
    } else {
      return lb.editReply({
        content: "هذه الرتبة ليست موجودة بالفعل في هذا الامر",
      });
    }

    fs.writeFile(
      "./config.json",
      JSON.stringify(json, null, 2),
      "utf8",
      (err) => {
        if (err) {
          return lb.editReply({
            content: "حدث خطا اثناء تحديث الاعدادات",
          });
        }

        let content = `تم ازالة اصحاب رتبة ${role} من الأمر ${cmd}`;

        lb.editReply({ content });
      },
    );
  });
};

module.exports = {
  name: "حذف_صلاحية",
  description: "حذف صلاحية امر من رتبة معينة",
  catg: "mod",
  prms: "owners",
  options: [
    {
      name: "امر",
      type: "STRING",
      description: "اختر الامر",
      choices: [
        { name: "تصفير", value: "tasfeer" },
        { name: "انشاء تحضير", value: "create" },
        { name: "حذف تحضير", value: "delete" },
        { name: "توب", value: "top" },
        { name: "تعديل نقاط", value: "edit" },
        { name: "تذكير", value: "remind" },
        { name: "تسجيل نقاط", value: "points" },
      ],
      required: true,
    },
    {
      name: "الرتبة",
      description: "اختر رتبة لازالة صلاحية الامر",
      required: true,
      type: "ROLE",
    },
  ],
  run: async (lb, bot) => {
    let cmd = lb.options.getString("امر");
    let role = lb.options.getRole("الرتبة");
    await lb.deferReply({ ephemeral: true });

    const index = bot.config.roles[cmd].indexOf(role.id);
    if (index > -1) {
      bot.config.roles[cmd].splice(index, 1);
      updateConfigRemove(cmd, role, lb);
    } else {
      return lb.editReply({
        content: "هذه الرتبة ليست موجودة بالفعل في هذا الامر",
      });
    }
  },
};
