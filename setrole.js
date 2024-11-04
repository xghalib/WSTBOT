const Discord = require("discord.js");
const ms = require("ms");
const prettyMilliseconds = require("pretty-ms");
const fs = require("fs");

const updateConfig = (cmd, role, lb) => {
  fs.readFile("./config.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return lb.editReply({
        content: "حدث خطا اثناء قراءة ملف الكونفج",
      });
    }

    const json = JSON.parse(data);
    json.roles[cmd].push(role.id);

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

        let content = `تم اضافة اصحاب رتبة ${role} الى الأمر ${cmd}`;

        lb.editReply({ content });
      },
    );
  });
};

module.exports = {
  name: "صلاحية",
  description: "اعطاء رتبة معينة صلاحية امر",
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
      description: "اختر رتبة لاستعمال هذا الامر",
      required: true,
      type: "ROLE",
    },
  ],
  run: async (lb, bot) => {
    let cmd = lb.options.getString("امر");
    let role = lb.options.getRole("الرتبة");
    await lb.deferReply({ ephemeral: true });

    bot.config.roles[cmd].push(role.id);
    updateConfig(cmd, role, lb);
  },
};
