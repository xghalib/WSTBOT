const Discord = require("discord.js");
const ms = require("ms");
const prettyMilliseconds = require("pretty-ms");
const fs = require("fs");

const updateConfig = (time, lb) => {
  fs.readFile("./config.json", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return lb.editReply({
        content: "حدث خطا اثناء تحديث الاعدادات",
      });
    }

    const json = JSON.parse(data);
    json.time = time;

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

        const content =
          time === 0
            ? "تم إيقاف تذكير الاعضاء"
            : `سيتم تذكير الاعضاء كل ${prettyMilliseconds(time, {
                verbose: true,
              })
                .replace("minutes", "دقائق")
                .replace("hours", "ساعات")
                .replace("days", "أيام")
                .replace("seconds", "ثواني")}`;

        lb.editReply({ content });
      },
    );
  });
};

module.exports = {
  name: "تذكير",
  description: "تذكير الشخص بالحضور كل مدة",
  catg: "mod",
  prms: "remind",
  options: [
    {
      name: "المدة",
      type: "STRING",
      description: "مثلا: 1h, 3d, 4h",
      required: true,
    },
  ],
  run: async (lb, bot) => {
    let time = lb.options.getString("المدة");
    await lb.deferReply({ ephemeral: true });

    if (!/^\d+[dhms]$/.test(time)) {
      if (time === "0") {
        return updateConfig(0, lb);
      }
      return lb.editReply({
        content: "قم بإدخال وقت صحيح (e.g): 1h, 3d, 4h",
      });
    }

    const timeInMs = ms(time);
    bot.config.time = timeInMs;
    updateConfig(timeInMs, lb);
  },
};
