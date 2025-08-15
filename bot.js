// Beispielhafte Speicher für Mute- und Ban-Zeiten (in Memory, für Demo)
const muteTimes = new Map(); // userId -> timestamp (Ende)
const banTimes = new Map();  // userId -> timestamp (Ende)


// ...existing code...
// Einfacher Discord-Bot mit discord.js v14


require('dotenv').config();

const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// Erstelle neuen Client mit n tigen Intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// Event: Bot ist bereit
client.once('ready', () => {
  console.log('Bot ist online!');
});

client.login(process.env.TOKEN); // ✅
// Slash-Command registrieren (einmalig beim Start)
const commands = [
  new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Schickt einem User eine DM')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Die User-ID des Empfängers')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Die Nachricht')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicke einen User vom Server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu kickende User')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Grund für den Kick')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannt einen User vom Server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu bannende User')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Dauer des Banns (z.B. 10S, 5M, 2D, permanent)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Grund für den Bann')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Entbannt einen User per User-ID')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Die User-ID des zu entbannenden Users')
        .setRequired(true))
  ,
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Löscht eine bestimmte Anzahl an Nachrichten im aktuellen Channel oder alle mit "all"')
    .addStringOption(option =>
      option.setName('anzahl')
        .setDescription('Wie viele Nachrichten sollen gelöscht werden? (1-100 oder "all")')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Stummschalten eines Users für eine bestimmte Zeit')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu mutende User')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Dauer des Mutes (z.B. 10s, 5m, 2h, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Grund für das Muten')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Entmutet einen User')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der zu entmutende User')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('role')
    .setDescription('Gibt einem User eine oder mehrere Rollen (oder entfernt sie)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der User, dem Rollen gegeben/genommen werden sollen')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role1')
        .setDescription('Rolle 1')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role2')
        .setDescription('Rolle 2')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role3')
        .setDescription('Rolle 3')
        .setRequired(false)),
  new SlashCommandBuilder()
    .setName('ankündigung')
    .setDescription('Erstellt eine Ankündigung im Ankündigungs-Channel')
    .addStringOption(option =>
      option.setName('titel')
        .setDescription('Titel der Ankündigung')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Text der Ankündigung')
        .setRequired(true))
].map(cmd => cmd.toJSON());

// Ersetze durch deine IDs!
const CLIENT_ID = '1402046604109811783';
const GUILD_ID = '1402028043299717210';

const token = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(token);


(function registerSlashCommands() {
  (async () => {
    try {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
      console.log('Slash-Command /dm registriert!');
    } catch (error) {
      console.error(error);
    }
  })();
})();

// In-memory modlog array for demonstration
const modlog = []; // [{ userId, type, reason, time }]

// Event: Interaktion empfangen
client.on('interactionCreate', async interaction => {
  if (interaction.commandName === 'mutetime') {
    const user = interaction.options.getUser('user');
    const muteEnd = muteTimes.get(user.id);
    let rest = 'Nicht gemutet';
    if (muteEnd && muteEnd > Date.now()) {
      const ms = muteEnd - Date.now();
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      rest = `${min}m ${sec}s`;
    }
    // Account-Alter berechnen
    const created = `<t:${Math.floor(user.createdTimestamp/1000)}:R>`;
    const embed = new EmbedBuilder()
      .setTitle('Mute-Status')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord seit', value: created, inline: true },
        { name: 'Verbleibende Mute-Zeit', value: rest, inline: false }
      )
      .setColor('#000000')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  if (interaction.commandName === 'bantime') {
    const user = interaction.options.getUser('user');
    const banEnd = banTimes.get(user.id);
    let rest = 'Nicht gebannt';
    if (banEnd && banEnd > Date.now()) {
      const ms = banEnd - Date.now();
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      rest = `${min}m ${sec}s`;
    }
    // Account-Alter berechnen
    const created = `<t:${Math.floor(user.createdTimestamp/1000)}:R>`;
    const embed = new EmbedBuilder()
      .setTitle('Ban-Status')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord seit', value: created, inline: true },
        { name: 'Verbleibende Ban-Zeit', value: rest, inline: false }
      )
      .setColor('#000000')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'dm') {
    // Nur Mitglieder mit Rolle 1403716772770742284 dürfen /dm ausführen
    if (!interaction.member.roles.cache.has('1403716772770742284')) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', ephemeral: true });
      return;
    }
    const userId = interaction.options.getString('userid');
    const text = interaction.options.getString('text');
    try {
      // User kann auch außerhalb des Servers sein
      const user = await client.users.fetch(userId, { force: true });
      await user.send(text);
      await interaction.reply({ content: `Nachricht an <@${userId}> gesendet!`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'Konnte die Nachricht nicht senden. Prüfe die User-ID!', ephemeral: true });
    }
  }

  if (interaction.commandName === 'ankündigung') {
    // Rollen-Check: Nur User mit Rolle 'Airez' oder höher dürfen /ankündigung nutzen
    const erlaubteRollen = [
      'AIREZ_ROLE_ID', // Ersetze durch die echte Rollen-ID von 'Airez'
      // ggf. weitere Rollen-IDs für "trüber airez" oder höhere Rollen
    ];
    if (!erlaubteRollen.some(rid => interaction.member.roles.cache.has(rid))) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', ephemeral: true });
      return;
    }
    const titel = interaction.options.getString('titel');
    const text = interaction.options.getString('text');
    const von = interaction.user.tag;
    const channelId = '1403721803456712724';
    const channel = await client.channels.fetch(channelId);

    if (!channel) {
      await interaction.reply({ content: 'Ankündigungs-Channel nicht gefunden!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(titel)
      .setDescription(text)
      .setColor('#000000') // Schwarz
      .setFooter({ text: `Von: ${von}` })
      .setTimestamp();

    await channel.send({ content: '@everyone', embeds: [embed] });
    await interaction.reply({ content: 'Ankündigung wurde gesendet!', ephemeral: true });
  }

  if (interaction.commandName === 'kick') {
    // Nur Mitglieder mit Rolle 1402042622360682587, 1402042198362689577 oder 1402042568673464360 dürfen kicken
    if (
      !interaction.member.roles.cache.has('1402042622360682587') &&
      !interaction.member.roles.cache.has('1402042198362689577') &&
      !interaction.member.roles.cache.has('1402042568673464360')
    ) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, User zu kicken!', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }
    try {
      // DM an den User mit dem Grund
      await user.send(`Du wurdest vom Server **${interaction.guild.name}** gekickt.\nGrund: ${reason}`);
    } catch (dmError) {
      // Ignoriere Fehler beim Senden der DM
    }
    try {
      await member.kick(reason);
      // Add to modlog
      modlog.push({ userId: user.id, type: 'kick', reason, time: Date.now() });
      await interaction.reply({ content: `User ${user.tag} wurde gekickt. Grund: ${reason}`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'Konnte den User nicht kicken.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'ban') {
    // Nur Mitglieder mit Rolle 1402042622360682587 oder 1402042198362689577 dürfen bannen
    if (
      !interaction.member.roles.cache.has('1402042622360682587') &&
      !interaction.member.roles.cache.has('1402042198362689577')
    ) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, User zu bannen!', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';
    const time = interaction.options.getString('time').toLowerCase();
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }
    let durationMs = null;
    if (time === 'permanent') {
      durationMs = null;
    } else if (time.endsWith('s')) {
      durationMs = parseInt(time) * 1000;
    } else if (time.endsWith('m')) {
      durationMs = parseInt(time) * 60 * 1000;
    } else if (time.endsWith('d')) {
      durationMs = parseInt(time) * 24 * 60 * 60 * 1000;
    } else {
      await interaction.reply({ content: 'Ungültiges Zeitformat! Nutze z.B. 10S, 5M, 2D oder permanent.', ephemeral: true });
      return;
    }
    try {
      await user.send(`Du wurdest vom Server **${interaction.guild.name}** gebannt.\nGrund: ${reason}\nDauer: ${time}`);
    } catch (dmError) {
      // Ignoriere Fehler beim Senden der DM
    }
    try {
      await member.ban({ reason });
      // Add to modlog
      modlog.push({ userId: user.id, type: 'ban', reason, time: Date.now() });
      await interaction.reply({ content: `User ${user.tag} wurde gebannt. Grund: ${reason} Dauer: ${time}`, ephemeral: true });
      if (durationMs) {
        setTimeout(async () => {
          try {
            await interaction.guild.members.unban(user.id, 'Ban abgelaufen');
          } catch (e) {
            // User war evtl. schon entbannt
          }
        }, durationMs);
      }
    } catch (err) {
      await interaction.reply({ content: 'Konnte den User nicht bannen.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'unban') {
    // Nur Mitglieder mit Rolle 1402042622360682587 oder 1402042198362689577 dürfen entbannen
    if (
      !interaction.member.roles.cache.has('1402042622360682587') &&
      !interaction.member.roles.cache.has('1402042198362689577')
    ) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, User zu entbannen!', ephemeral: true });
      return;
    }
    const userId = interaction.options.getString('userid');
    try {
      await interaction.guild.members.unban(userId);
      // Add to modlog
      modlog.push({ userId, type: 'unban', reason: 'Entbannt', time: Date.now() });
      await interaction.reply({ content: `User mit ID ${userId} wurde entbannt.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'Konnte den User nicht entbannen. Prüfe die User-ID!', ephemeral: true });
    }
  }

  if (interaction.commandName === 'clear') {
    // Nur Mitglieder mit Rolle 1402043028012535890 dürfen /clear ausführen
    if (!interaction.member.roles.cache.has('1402043028012535890')) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', ephemeral: true });
      return;
    }
    const anzahlInput = interaction.options.getString('anzahl');
    if (anzahlInput.toLowerCase() === 'all') {
      // Lösche alle Nachrichten (so viele wie möglich, Discord-Limit: 100 pro Aufruf, max 14 Tage alt)
      let deletedTotal = 0;
      let lastId;
      try {
        while (true) {
          const options = { limit: 100 };
          if (lastId) options.before = lastId;
          const messages = await interaction.channel.messages.fetch(options);
          if (messages.size === 0) break;
          const deleted = await interaction.channel.bulkDelete(messages, true);
          deletedTotal += deleted.size;
          if (messages.size < 100) break;
          lastId = messages.last().id;
        }
        await interaction.reply({ content: `${deletedTotal} Nachrichten wurden gelöscht (so viele wie möglich).`, ephemeral: true });
      } catch (err) {
        await interaction.reply({ content: 'Fehler beim Löschen der Nachrichten. Beachte, dass nur Nachrichten gelöscht werden können, die nicht älter als 14 Tage sind.', ephemeral: true });
      }
      return;
    }
    const anzahl = parseInt(anzahlInput);
    if (isNaN(anzahl) || anzahl < 1 || anzahl > 100) {
      await interaction.reply({ content: 'Bitte gib eine Zahl zwischen 1 und 100 an oder "all" für alle Nachrichten.', ephemeral: true });
      return;
    }
    try {
      const deleted = await interaction.channel.bulkDelete(anzahl, true);
      await interaction.reply({ content: `${deleted.size} Nachrichten wurden gelöscht.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: 'Fehler beim Löschen der Nachrichten. Beachte, dass nur Nachrichten gelöscht werden können, die nicht älter als 14 Tage sind.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'mute') {
    // Nur Mitglieder mit Rolle 1402043028012535890 dürfen muten
    if (!interaction.member.roles.cache.has('1402043028012535890')) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, User zu muten!', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Kein Grund angegeben';
    const time = interaction.options.getString('time').toLowerCase();
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }
    // Zeit umrechnen
    let durationMs = null;
    if (time.endsWith('s')) {
      durationMs = parseInt(time) * 1000;
    } else if (time.endsWith('m')) {
      durationMs = parseInt(time) * 60 * 1000;
    } else if (time.endsWith('h')) {
      durationMs = parseInt(time) * 60 * 60 * 1000;
    } else if (time.endsWith('d')) {
      durationMs = parseInt(time) * 24 * 60 * 60 * 1000;
    } else {
      await interaction.reply({ content: 'Ungültiges Zeitformat! Nutze z.B. 10s, 5m, 2h, 1d.', ephemeral: true });
      return;
    }
    // Mute-Rolle ID
    const muteRoleId = '1402053030114754572';
    try {
      await member.roles.add(muteRoleId, reason);
      // Add to modlog
      modlog.push({ userId: user.id, type: 'mute', reason, time: Date.now() });
      await interaction.reply({ content: `User ${user.tag} wurde für ${time} gemutet. Grund: ${reason}`, ephemeral: true });
      // DM an User
      try {
        await user.send(`Du wurdest auf **${interaction.guild.name}** für ${time} gemutet.\nGrund: ${reason}`);
      } catch (e) {}
      // Timer zum Entmuten
      setTimeout(async () => {
        try {
          await member.roles.remove(muteRoleId, 'Mute abgelaufen');
        } catch (e) {}
      }, durationMs);
    } catch (err) {
      await interaction.reply({ content: 'Konnte den User nicht muten.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'unmute') {
    // Nur Mitglieder mit Rolle 1402043028012535890 dürfen entmuten
    if (!interaction.member.roles.cache.has('1402043028012535890')) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, User zu entmuten!', ephemeral: true });
      return;
    }
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }
    const muteRoleId = '1402053030114754572';
    try {
      await member.roles.remove(muteRoleId, 'Manuell entmutet');
      // Add to modlog
      modlog.push({ userId: user.id, type: 'unmute', reason: 'Entmutet', time: Date.now() });
      await interaction.reply({ content: `User ${user.tag} wurde entmutet.`, ephemeral: true });
      try {
        await user.send(`Du wurdest auf **${interaction.guild.name}** entmutet.`);
      } catch (e) {}
    } catch (err) {
      await interaction.reply({ content: 'Konnte den User nicht entmuten.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'role') {
    const targetUser = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(targetUser.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }

    // Berechtigungsprüfung
    const requiredRoleId = '1402043459539570810';
    const authorMember = interaction.guild.members.cache.get(interaction.user.id);
    const requiredRole = interaction.guild.roles.cache.get(requiredRoleId);

    // Prüfe, ob der User die Rolle hat oder eine höhere Rolle besitzt
    const hasRequiredRole = authorMember.roles.cache.has(requiredRoleId);
    const isHigher = authorMember.roles.highest.position > (requiredRole ? requiredRole.position : 0);

    if (!hasRequiredRole && !isHigher) {
      await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', ephemeral: true });
      return;
    }

    // Rollen auslesen
    const roles = [];
    for (let i = 1; i <= 3; i++) {
      const role = interaction.options.getRole(`role${i}`);
      if (role) roles.push(role);
    }

    if (roles.length === 0) {
      await interaction.reply({ content: 'Bitte gib mindestens eine Rolle an.', ephemeral: true });
      return;
    }

    let added = [];
    let removed = [];
    for (const role of roles) {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role, `Entfernt durch ${interaction.user.tag} via /role`);
        removed.push(role.name);
      } else {
        await member.roles.add(role, `Hinzugefügt durch ${interaction.user.tag} via /role`);
        added.push(role.name);
      }
    }

    let msg = '';
    if (added.length) msg += `Hinzugefügt: ${added.join(', ')}\n`;
    if (removed.length) msg += `Entfernt: ${removed.join(', ')}\n`;
    if (!msg) msg = 'Keine gültigen Rollen gefunden oder geändert.';

    await interaction.reply({ content: msg, ephemeral: true });
  }

  // Handler for /member command
  if (interaction.commandName === 'member') {
    const user = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      await interaction.reply({ content: 'User nicht auf diesem Server gefunden.', ephemeral: true });
      return;
    }
    // Modlog-Einträge der letzten 30 Tage
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const actions = modlog
      .filter(log => log.userId === user.id && log.time >= since)
      .map(log =>
        `**${log.type.toUpperCase()}**: ${log.reason} (<t:${Math.floor(log.time / 1000)}:R>)`
      )
      .join('\n') || 'Keine Aktionen im letzten Monat.';

    const embed = new EmbedBuilder()
      .setTitle(`Mitglied: ${user.tag}`)
      .setColor('#000000')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Name', value: user.tag, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord beigetreten', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: false },
        { name: 'Server beigetreten', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
        { name: 'Rollen', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `<@&${r.id}>`).join(', ') || 'Keine', inline: false },
        { name: 'Mod-Aktionen (letzter Monat)', value: actions, inline: false }
      );
    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
});

// Event: Wenn ein neues Mitglied dem Server beitritt, Rolle vergeben + Join-Log als Embed
client.on('guildMemberAdd', async member => {
  // Rolle zuweisen wie bisher
  try {
    const role = member.guild.roles.cache.get('1402042099330715668');
    if (role) {
      await member.roles.add(role);
    }
  } catch (err) {
    console.error('Fehler beim Zuweisen der Rolle:', err);
  }

  // Join-Log Embed
  try {
    const logChannel = member.guild.channels.cache.get('1404505485125882057');
    if (!logChannel) return;

    // Invite-Info (optional, meist nicht verfügbar ohne Invite-Tracking)
    let inviteInfo = 'Unbekannt';
    try {
      const invites = await member.guild.invites.fetch();
      const usedInvite = invites.find(inv => inv.uses > (inv._uses || 0));
      if (usedInvite) {
        inviteInfo = `Invite: ${usedInvite.code} (${usedInvite.inviter?.tag || 'Unbekannt'})`;
      }
    } catch (e) {}

    const embed = new EmbedBuilder()
      .setTitle('Neues Mitglied gejoint')
      .setColor('#000000')
      .addFields(
        { name: 'Wer', value: `${member.user.tag} (${member.id})`, inline: false },
        { name: 'Von wo', value: inviteInfo, inline: false },
        { name: 'Wann', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:f>`, inline: false }
      )
      .setThumbnail(member.user.displayAvatarURL());

    await logChannel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Fehler beim Senden des Join-Logs:', err);
  }
});

// Speicher für Join-to-Create-Konfiguration und Voice-Owner
const joinToCreateConfig = {}; // { guildId: { channelId, categoryId } }
const voiceOwners = {}; // { channelId: ownerId }
const voiceBans = {}; // { channelId: Set<userId> }

// Setup-Befehl per Chatnachricht
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // Setup starten
  if (message.content === '!join-to-create setup') {
    await message.reply('Bitte gib die ID des Voice-Channels an, der als Join-to-Create dienen soll:');
    const filter = m => m.author.id === message.author.id;
    try {
      const collected1 = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const voiceChannelId = collected1.first().content;
      const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
      if (!voiceChannel || voiceChannel.type !== 2) {
        await message.reply('Ungültige Voice-Channel-ID.');
        return;
      }
      await message.reply('Bitte gib die ID der Kategorie an, in der neue Voice-Channels erstellt werden sollen:');
      const collected2 = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
      const categoryId = collected2.first().content;
      const category = message.guild.channels.cache.get(categoryId);
      if (!category || category.type !== 4) {
        await message.reply('Ungültige Kategorie-ID.');
        return;
      }
      joinToCreateConfig[message.guild.id] = { channelId: voiceChannelId, categoryId };
      await message.reply('Join-to-Create wurde eingerichtet!');
    } catch (e) {
      await message.reply('Zeit abgelaufen oder Fehler bei der Einrichtung.');
    }
  }

  // Voice Owner Befehle
  if (message.content.startsWith('!voice-')) {
    // Channel finden, in dem der User gerade ist
    const member = message.guild.members.cache.get(message.author.id);
    const voiceChannel = member.voice.channel;
    if (!voiceChannel || !voiceOwners[voiceChannel.id]) return;
    if (voiceOwners[voiceChannel.id] !== message.author.id) {
      await message.reply('Nur der Owner dieses Voice-Channels kann diese Befehle nutzen.');
      return;
    }

    // !voice-ban @user
    if (message.content.startsWith('!voice-ban')) {
      const user = message.mentions.users.first();
      if (!user) return message.reply('Bitte erwähne einen User.');
      if (!voiceBans[voiceChannel.id]) voiceBans[voiceChannel.id] = new Set();
      voiceBans[voiceChannel.id].add(user.id);
      // Kicke den User, falls er im Channel ist
      const memberToKick = message.guild.members.cache.get(user.id);
      if (memberToKick && memberToKick.voice.channelId === voiceChannel.id) {
        await memberToKick.voice.disconnect();
      }
      await message.reply(`${user.tag} wurde aus dem Voice gebannt.`);
    }

    // !voice-kick @user
    if (message.content.startsWith('!voice-kick')) {
      const user = message.mentions.users.first();
      if (!user) return message.reply('Bitte erwähne einen User.');
      const memberToKick = message.guild.members.cache.get(user.id);
      if (memberToKick && memberToKick.voice.channelId === voiceChannel.id) {
        await memberToKick.voice.disconnect();
        await message.reply(`${user.tag} wurde aus dem Voice gekickt.`);
      } else {
        await message.reply('User ist nicht im Channel.');
      }
    }

    // !voice-transfer @user
    if (message.content.startsWith('!voice-transfer')) {
      const user = message.mentions.users.first();
      if (!user) return message.reply('Bitte erwähne einen User.');
      if (!voiceChannel.members.has(user.id)) return message.reply('User ist nicht im Channel.');
      voiceOwners[voiceChannel.id] = user.id;
      await message.reply(`${user.tag} ist jetzt der Owner dieses Voice-Channels.`);
    }

    // !voice-unban @user
    if (message.content.startsWith('!voice-unban')) {
      const user = message.mentions.users.first();
      if (!user) return message.reply('Bitte erwähne einen User.');
      if (voiceBans[voiceChannel.id]) voiceBans[voiceChannel.id].delete(user.id);
      await message.reply(`${user.tag} wurde entbannt.`);
    }

    // !voice-limit ANZAHL
    if (message.content.startsWith('!voice-limit')) {
      const args = message.content.split(' ');
      const limit = parseInt(args[1]);
      if (isNaN(limit) || limit < 0 || limit > 99) return message.reply('Bitte gib eine gültige Zahl (0-99) an.');
      await voiceChannel.setUserLimit(limit);
      await message.reply(`User-Limit auf ${limit} gesetzt.`);
    }

    // !voice-rename NEUER_NAME
    if (message.content.startsWith('!voice-rename')) {
      const args = message.content.split(' ');
      const newName = args.slice(1).join(' ').trim();
      if (!newName) return message.reply('Bitte gib einen neuen Namen an.');
      if (newName.length > 100) return message.reply('Der Name darf maximal 100 Zeichen lang sein.');
      try {
        await voiceChannel.setName(newName);
        await message.reply(`Channel-Name wurde zu "${newName}" geändert.`);
      } catch (e) {
        await message.reply('Fehler beim Umbenennen des Channels.');
      }
    }
  }
});

// Voice-Channel-Join-Event
client.on('voiceStateUpdate', async (oldState, newState) => {
  // User joint einem Channel
  const config = joinToCreateConfig[newState.guild.id];
  if (!config) return;
  if (newState.channelId === config.channelId) {
    // Prüfe Ban
    if (voiceBans[config.channelId] && voiceBans[config.channelId].has(newState.id)) {
      setTimeout(() => newState.disconnect(), 500);
      return;
    }
    // Erstelle neuen Channel
    const newChannel = await newState.guild.channels.create({
      name: `${newState.member.displayName}'s Raum`,
      type: 2,
      parent: config.categoryId,
      permissionOverwrites: [
        {
          id: newState.id,
          allow: ['ManageChannels', 'MuteMembers', 'MoveMembers', 'DeafenMembers'],
        }
      ]
    });
    // Owner merken
    voiceOwners[newChannel.id] = newState.id;
    // User verschieben
    await newState.setChannel(newChannel);
    // Channel löschen, wenn leer
    const interval = setInterval(async () => {
      const ch = newState.guild.channels.cache.get(newChannel.id);
      if (!ch || ch.members.size === 0) {
        clearInterval(interval);
        voiceOwners[newChannel.id] = undefined;
        voiceBans[newChannel.id] = undefined;
        await ch.delete().catch(() => {});
      }
    }, 10000);
  }

  // Ban-Check für bestehende Channels

  if (
    newState.channelId &&
    voiceBans[newState.channelId] &&
    voiceBans[newState.channelId].has(newState.id)
  ) {
    // setTimeout(() => newState.disconnect(), 500); // Entfernt, da newState hier nicht definiert ist
  }
});

// Melde dich mit deinem Bot-Token an
client.login(token);

// Ignoriere Systemnachrichten oder Nachrichten ohne Inhalt
client.on('messageDelete', async (message) => {
  if (!message.guild || message.partial || !message.content) return;

  const logChannel = message.guild.channels.cache.get('1404123828514197605');
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('Nachricht gelöscht')
    .setColor('#000000')
    .addFields(
      { name: 'User', value: message.author ? `${message.author.tag}` : 'Unbekannt', inline: true },
      { name: 'Zeit', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
      { name: 'Nachricht', value: message.content.length > 1024 ? message.content.slice(0, 1021) + '...' : message.content }
    );

  await logChannel.send({ embeds: [embed] });
});
