require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TARGET_ROLE = process.env.TARGET_ROLE;
const TEST_COMMAND = '!ping'; // Command to test bot responsiveness
const LOG_CHANNEL_NAME = 'bot-logs'; // Optional: create this channel for logging

// Utility function to ban a member safely
async function banMember(member, reason = 'Selected underage role') {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    try {
        await member.ban({ reason });
        console.log(`BANNED: ${member.user.tag} | Reason: ${reason}`);

        // Optional: log to Discord channel
        const logChannel = member.guild.channels.cache.find(ch => ch.name === LOG_CHANNEL_NAME);
        if (logChannel && logChannel.isTextBased()) {
            logChannel.send(`BANNED: ${member.user.tag} | Reason: ${reason}`);
        }
    } catch (err) {
        console.error(`Failed to ban ${member.user.tag}:`, err);
    }
}

// Ban existing members on startup
async function banExistingMembers() {
    for (const guild of client.guilds.cache.values()) {
        await guild.members.fetch(); // Ensure all members are cached
        for (const member of guild.members.cache.values()) {
            if (member.roles.cache.has(TARGET_ROLE)) {
                await banMember(member, 'Selected underage role (startup check)');
            }
        }
    }
}

// Ready event
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await banExistingMembers();
});

// Monitor role changes
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const hadRole = oldMember.roles.cache.has(TARGET_ROLE);
    const hasRole = newMember.roles.cache.has(TARGET_ROLE);

    if (!hadRole && hasRole) {
        await banMember(newMember, 'Selected underage role (role added)');
    }
});

// Simple chat command to test bot responsiveness
client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Ignore other bots
    if (message.content === TEST_COMMAND) {
        message.reply('Pong! I am online and responsive.');
    }
});

// Log in
client.login(process.env.TOKEN);