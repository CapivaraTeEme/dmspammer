const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Partials } = require("discord.js");
const fs = require("fs");

const { tokens } = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const bots = [];

const cmdbot = new Client({ intents: [GatewayIntentBits.Guilds] });

cmdbot.once("ready", async () => {
    const cmd = new SlashCommandBuilder()
        .setName("spamdms")
        .setDescription("Spam DMs")
        .addUserOption(o =>
            o.setName("user").setDescription("User to spam").setRequired(true)
        )
        .addStringOption(o =>
            o.setName("message").setDescription("Message").setRequired(true)
        );

    const rest = new REST({ version: "10" }).setToken(tokens[0]);

    await rest.put(
        Routes.applicationCommands(cmdbot.user.id),
        { body: [cmd.toJSON()] }
    );
    cmdbot.destroy();
});

cmdbot.login(tokens[0]);


tokens.forEach((token, index) => {

    const dmspam = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages
        ],
        partials: [Partials.Channel]
    });

    dmspam.once("clientReady", () => {
        console.log(`[BOT ${index + 1}] ${dmspam.user.tag} online.`);
    });

    dmspam.on("interactionCreate", async interaction => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName !== "spamdms") return;

        const user = interaction.options.getUser("user");
        const msg = interaction.options.getString("message");

        await interaction.reply({
            content: `Spamming DMS to ${user.tag}…`,
            ephemeral: true
        });

        const tasks = [];

        for (const b of bots) {
            tasks.push((async () => {
                try {
                    const target = await b.users.fetch(user.id);
                    const dm = await target.createDM();

                    for (let i = 0; i < 25; i++) {
                        await dm.send(msg).catch(() => {});
                    }

                } catch (e) { }
            })());
        }

        await Promise.all(tasks);
    });

    bots.push(dmspam);

    dmspam.login(token).catch(() => {
        console.log(`[BOT ${index + 1}] Token invalido.`);
    });
});
