const Discord = require("discord.js");
const ms = require("ms");
const Points = require("../../schema/points.js");

module.exports = {
  name: "تسجيل",
  description: "فحص القناة",
  aliases: [],
  usage: "!fetch",
  example: "!fetch",
  catg: "mod",
  cooldown: "3s",
  permissions: {
    user: [],
    bot: [],
  },
  options: [
    {
      name: "نقاط",
      type: 1,
      description: "فحص القناة لتسجيل النقاط",
      options: [
        {
          name: "الروم",
          type: "CHANNEL",
          description: "الروم",
          required: true,
        },
        {
          name: "نقطة",
          type: "NUMBER",
          description: "عدد النقاط لكل رسالة!",
          required: true,
        },
        {
          name: "من",
          type: "STRING",
          description: "ابدا من؟",
          required: true,
        },
      ],
    },
  ],
  path: "/fetch.js",
  run: async (lb, bot, db) => {
    await lb.deferReply({ ephemeral: false });

    let pointss = lb.options.getNumber("نقطة");
    let ch = lb.options.getChannel("الروم");
    let msgend = "";

    let userPointsMap = new Map();

    // Check if bot has necessary permissions
    const requiredPermissions = ['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY', 'SEND_MESSAGES', 'ADD_REACTIONS'];
    const botPermissions = ch.permissionsFor(lb.guild.me);

    if (!botPermissions.has(requiredPermissions)) {
      return lb.editReply({
        content: "البوت لا يمتلك الأذونات المطلوبة لتنفيذ هذه العملية. تأكد من أن البوت لديه أذونات: عرض القناة، قراءة سجل الرسائل، إرسال الرسائل، إضافة الرياكشن.",
        ephemeral: true,
      });
    }

    try {
      // Ensure the channel exists and bot has access
      if (!ch || !lb.guild.channels.cache.has(ch.id)) {
        return lb.editReply({
          content: "لا يمكن الوصول إلى الروم المحدد أو البوت لا يمتلك الصلاحيات المناسبة.",
          ephemeral: true,
        });
      }

      // Fetch messages
      let msgs = await ch.messages.fetch({
        limit: 100,
        after: lb.options.getString("من"),
      });

      // Filter messages that have both attachments and content
      let validMsgs = msgs.filter(
        (msg) => msg.attachments.size > 0 && msg.content !== ""
      );

      // If there are no valid messages
      if (validMsgs.size === 0) {
        return lb.editReply({
          content: "لا يوجد رسايل تحتوي على مرفقات ومحتوى لتسجيل النقاط",
          ephemeral: true,
        });
      }

      // Process valid messages
      for (const msg of validMsgs.values()) {
        // Skip any message that already has one or more reactions
        if (msg.reactions.cache.size > 0) {
            continue;
        }
    
        // Add the reaction if no reactions were found on the message
        await msg.react("✅");

        let user = await Points.findOne({ id: msg.author.id });
        if (!user) {
          user = new Points({
            username: msg.author.username,
            id: msg.author.id,
            points: 0,
          });
        }

        user.points += pointss;

        if (userPointsMap.has(msg.author.id)) {
          userPointsMap.set(
            msg.author.id,
            userPointsMap.get(msg.author.id) + pointss
          );
        } else {
          userPointsMap.set(msg.author.id, pointss);
        }

        await user.save();
      }

      // Prepare message content
      for (let [userId, totalPoints] of userPointsMap) {
        msgend += `<@${userId}> — ${totalPoints} نقطة\n`;
      }

      if (msgend === "") {
        return await lb.editReply({ content: "لا يوجد رسايل لتسجيلها" });
      }

      await lb.editReply({
        content: msgend,
        ephemeral: false,
      });

    } catch (error) {
      if (error.httpStatus === 403) {
        return lb.editReply({
          content: "البوت لا يمتلك إذن الوصول إلى هذه القناة.",
          ephemeral: true,
        });
      } else {
        console.error("Error fetching messages:", error);
        return lb.editReply({
          content: "حدث خطأ أثناء محاولة جلب الرسائل. تأكد من أن البوت يمتلك الصلاحيات الصحيحة.",
          ephemeral: true,
        });
      }
    }
  },
};
