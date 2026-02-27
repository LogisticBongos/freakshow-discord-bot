require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

const TARGET_ROLE = process.env.TARGET_ROLE;

// Utility function to ban a member safely
async function banMember(member, reason = 'Selected underage role') {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    try {
        await member.ban({ reason });
        console.log(`Banned ${member.user.tag}`);
    } catch (err) {
        console.error(`Failed to ban ${member.user.tag}:`, err);
    }
}

// Ban existing members who already have the role on startup
async function banExistingMembers() {
    for (const guild of client.guilds.cache.values()) {
        await guild.members.fetch(); // fetch all members to ensure cache is filled
        for (const member of guild.members.cache.values()) {
            if (member.roles.cache.has(TARGET_ROLE)) {
                await banMember(member, 'Selected underage role (startup check)');
            }
        }
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await banExistingMembers();
});

// Ban members when they get the role in the future
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const hadRole = oldMember.roles.cache.has(TARGET_ROLE);
    const hasRole = newMember.roles.cache.has(TARGET_ROLE);

    if (!hadRole && hasRole) {
        await banMember(newMember, 'Selected underage role (role added)');
    }
});

client.login(process.env.TOKEN);