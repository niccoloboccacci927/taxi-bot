const TAXI_ROLE_ID = "1455329847122591918";
const TAXI_CHANNEL_ID = "1468316689174364374";
const LOG_CHANNEL_ID = "1455328423156252824";
const STAFF_ROLE_ID = "1455329952395296901";
const {
Client,
GatewayIntentBits,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
REST,
Routes,
SlashCommandBuilder
} = require("discord.js");

const express = require("express");

const client = new Client({
 intents:[GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ================= SERVER RENDER =================

const app = express();

app.get("/", (req,res)=>{
 res.send("Taxi Bot Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
 console.log("Server web attivo");
});

// ================= CONFIG =================

const TAXI_ROLE = "ID_RUOLO_TAXI";
const STAFF_ROLE = "ID_RUOLO_STAFF";
const TAXI_CHANNEL = "ID_CANALE_TAXI";

// ================= READY =================

client.once("ready", async()=>{

 console.log(`Bot online come ${client.user.tag}`);

 const commands = [

 new SlashCommandBuilder()
 .setName("taxi")
 .setDescription("Chiama un taxi"),

 new SlashCommandBuilder()
 .setName("taxi-roulette")
 .setDescription("Sceglie un cliente a caso"),

 new SlashCommandBuilder()
 .setName("pexdepex")
 .setDescription("Gestione taxisti")

 ].map(cmd=>cmd.toJSON());

 const rest = new REST({version:"10"}).setToken(process.env.TOKEN);

 await rest.put(
 Routes.applicationCommands(client.user.id),
 {body:commands}
 );

 console.log("Slash commands registrati");

});

// ================= INTERACTIONS =================

client.on("interactionCreate", async interaction=>{

// ================= SLASH =================

if(interaction.isChatInputCommand()){

// ---------- TAXI ----------

if(interaction.commandName === "taxi"){

const modal = new ModalBuilder()
.setCustomId("taxi_modal")
.setTitle("Richiesta Taxi");

const roblox = new TextInputBuilder()
.setCustomId("roblox")
.setLabel("Nome Roblox")
.setStyle(TextInputStyle.Short);

const posizione = new TextInputBuilder()
.setCustomId("posizione")
.setLabel("Posizione")
.setStyle(TextInputStyle.Short);

const destinazione = new TextInputBuilder()
.setCustomId("destinazione")
.setLabel("Destinazione")
.setStyle(TextInputStyle.Short);

modal.addComponents(
new ActionRowBuilder().addComponents(roblox),
new ActionRowBuilder().addComponents(posizione),
new ActionRowBuilder().addComponents(destinazione)
);

await interaction.showModal(modal);

}

// ---------- TAXI ROULETTE ----------

if(interaction.commandName === "taxi-roulette"){

const role = interaction.guild.roles.cache.get(TAXI_ROLE);

const members = role.members.map(m=>m);

if(members.length === 0)
return interaction.reply("Nessun taxista disponibile");

const random = members[Math.floor(Math.random()*members.length)];

interaction.reply(`🎰 Il taxista scelto è ${random}`);

}

// ---------- PEX DEPEX ----------

if(interaction.commandName === "pexdepex"){

if(!interaction.member.roles.cache.has(STAFF_ROLE))
return interaction.reply({content:"Non hai permessi",ephemeral:true});

const role = interaction.guild.roles.cache.get(TAXI_ROLE);

const members = role.members.map(m=>m);

if(members.length === 0)
return interaction.reply("Nessun taxista trovato");

let list="";

members.forEach((m,i)=>{
 list += `${i+1}. ${m.user.tag}\n`
});

await interaction.reply({
content:`🚕 **Lista Taxisti**

${list}

Scrivi nel formato:

numero azione motivo(opzionale)

Esempi:
3 pex bravo guidatore
2 depex inattivo
5 rimozione`,
ephemeral:true
});

const filter = m=>m.author.id === interaction.user.id;

const collector = interaction.channel.createMessageCollector({
filter,
time:60000,
max:1
});

collector.on("collect", async msg=>{

const args = msg.content.split(" ");

const index = parseInt(args[0])-1;
const action = args[1];
const reason = args.slice(2).join(" ") || "Nessun motivo";

const target = members[index];

if(!target) return msg.reply("Numero non valido");

if(action === "pex"){
 await target.roles.add(TAXI_ROLE);
 msg.reply(`✅ ${target.user.tag} promosso\nMotivo: ${reason}`);
}

if(action === "depex"){
 await target.roles.remove(TAXI_ROLE);
 msg.reply(`❌ ${target.user.tag} degradato\nMotivo: ${reason}`);
}

if(action === "rimozione"){
 await target.roles.remove(TAXI_ROLE);
 msg.reply(`🚫 ${target.user.tag} rimosso\nMotivo: ${reason}`);
}

});

}

}

// ================= MODAL TAXI =================

if(interaction.isModalSubmit()){

if(interaction.customId === "taxi_modal"){

const roblox = interaction.fields.getTextInputValue("roblox");
const posizione = interaction.fields.getTextInputValue("posizione");
const destinazione = interaction.fields.getTextInputValue("destinazione");

const row = new ActionRowBuilder().addComponents(

new ButtonBuilder()
.setCustomId("accetta")
.setLabel("Accetta")
.setStyle(ButtonStyle.Success),

new ButtonBuilder()
.setCustomId("rifiuta")
.setLabel("Rifiuta")
.setStyle(ButtonStyle.Danger)

);

const channel = client.channels.cache.get(TAXI_CHANNEL);

channel.send({
content:`🚕 **Nuova richiesta taxi**

Cliente: ${interaction.user}
Roblox: ${roblox}
Posizione: ${posizione}
Destinazione: ${destinazione}

<@&${TAXI_ROLE}>`,
components:[row]
});

interaction.reply({content:"Taxi chiamato!",ephemeral:true});

}

}

// ================= BUTTONS =================

if(interaction.isButton()){

if(interaction.customId === "accetta")
interaction.reply("🚕 Corsa accettata");

if(interaction.customId === "rifiuta")
interaction.reply("❌ Corsa rifiutata");

}

});

// ================= LOGIN =================

client.login(process.env.TOKEN);