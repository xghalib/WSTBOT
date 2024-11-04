const Discord = require("discord.js");
const Users = require("../../schema/users.js");  // Schema to fetch user login data

// Add the role IDs that are allowed to use this command
const allowedRoles = ["1294971359440670815", "925819412882284634"];  // Replace with actual role IDs

module.exports = {
  name: "attendance_report",
  description: "Generates a report of total attendance (hours logged in) for all members.",
  aliases: ["report", "attendance"],
  usage: "/attendance_report",
  example: "/attendance_report",
  catg: "mod",
  cooldown: "5s",  // Set a cooldown to avoid spam
  options: [],  // No options needed for now
  run: async (lb, bot, db) => {
    // Check if the user has at least one of the allowed roles
    const memberRoles = lb.member.roles.cache.map(role => role.id);
    const hasPermission = allowedRoles.some(role => memberRoles.includes(role));
    
    if (!hasPermission) {
      return lb.reply({ content: "❌ **ليس لديك الصلاحيات لتنفيذ هذا الأمر.**", ephemeral: true });
    }

    await lb.deferReply({ ephemeral: false });

    // Fetch all users and their login data
    let users;
    try {
      users = await Users.find({}).sort({ total: -1 });  // Sort by total time logged in (descending)
    } catch (error) {
      return lb.editReply("حدث خطأ أثناء جلب بيانات المستخدمين.");
    }

    if (!users || users.length === 0) {
      return lb.editReply("لم يتم العثور على أي مستخدمين.");
    }

    const reportChunks = [];
    let report = "";
    let count = 1;

    // Process each user and build the report
    for (let user of users) {
      const totalMilliseconds = user.total || 0;  // Fetch total logged-in time in milliseconds
      
      // Skip users with zero logged time
      if (totalMilliseconds === 0) {
        continue;
      }

      const username = user.username || "Unknown User";

      // Convert total time from milliseconds to hours, minutes, seconds
      const totalSeconds = Math.floor(totalMilliseconds / 1000);
      const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');

      // Format the report with @mention and time
      report += `**${count}.** <@${user.id}> — \`${hours}h ${minutes}m ${seconds}s\`\n`;
      count++;

      // Handle Discord message length limit
      if (report.length >= 1800) {  // Chunk size set to avoid 2000 character limit
        reportChunks.push(report);
        report = "";  // Reset the report for the next chunk
      }
    }

    if (report.length > 0) {
      reportChunks.push(report);  // Push any remaining data
    }

    // Send the report chunks as embeds
    try {
      for (let i = 0; i < reportChunks.length; i++) {
        const embed = new Discord.MessageEmbed()
          .setTitle(`📊 **تقرير الحضور - الصفحة ${i + 1}**`)
          .setDescription(reportChunks[i])
          .setColor("#4CAF50")  // A green color to indicate success or progress
          .setFooter({ text: "تقرير الحضور " });

        await lb.channel.send({ embeds: [embed] });
      }

      await lb.editReply("✅ **تم إنشاء تقرير الحضور بنجاح!**");

    } catch (error) {
      console.error("Error sending attendance report:", error);
      return lb.editReply("حدث خطأ أثناء إرسال تقرير الحضور.");
    }
  },
};



