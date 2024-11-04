module.exports = {
    name: 'force_logout',
    description: 'Forcefully log a user out',
    options: [
      {
        name: 'user',
        description: 'The user to log out',
        type: 'USER',
        required: true
      }
    ],
    run: async (lb, bot, db) => {
      const userId = lb.options.getUser('user').id;
      const user = await db.models.Login.findOne({ id: userId });
  
      if (user && user.isLoggedIn !== "0") {
        user.isLoggedIn = "0";
        await user.save();
        return lb.reply({
          content: `User <@${userId}> has been forcefully logged out.`,
          ephemeral: true,
        });
      } else {
        return lb.reply({
          content: `User <@${userId}> is not logged in.`,
          ephemeral: true,
        });
      }
    }
  };
  