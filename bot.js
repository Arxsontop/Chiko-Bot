// Beispielhafte Speicher für Mute- und Ban-Zeiten (in Memory, für Demo)
// Erweitert: userId -> { end, reason, moderator }
const muteTimes = new Map(); // userId -> { end, reason, moderator }
const banTimes = new Map();  // userId -> { end, reason, moderator }

// Einfacher Discord-Bot mit discord.js v14


require('dotenv').config();

const { SlashCommandBuilder, REST, Routes } = require('discord.js');

const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

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

client.                                                                                                                                                                                                                                                       login(process.env.TOKEN); // ✅
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
  ,
  new SlashCommandBuilder()
    .setName('mutetime')
    .setDescription('Zeigt Mute-Infos eines Users')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der gemutete User')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('bantime')
    .setDescription('Zeigt Ban-Infos eines Users')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Der gebannte User')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('modlog')
    .setDescription('Zeigt Moderations-Historie eines Users (letztes Jahr)')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('Die User-ID des Users')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Antwortet mit Pong!')
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
  // Ping-Pong Command Handler
  if (interaction.isChatInputCommand() && interaction.commandName === 'ping') {
    await interaction.reply('Pong! 🏓');
    return;
  }

  if (interaction.commandName === 'mutetime') {
    // Nur Rolle mit ID 1402043028012535890 darf ausführen
    if (!interaction.member.roles.cache.has('1402043028012535890')) {
  await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Command auszuführen.', flags: 64 });
      return;
    }
    const user = interaction.options.getUser('user');
    const muteInfo = muteTimes.get(user.id);
    let rest = 'Nicht gemutet';
    let grund = '-';
    let moderator = '-';
    if (muteInfo && muteInfo.end > Date.now()) {
      const ms = muteInfo.end - Date.now();
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      rest = `${min}m ${sec}s`;
      grund = muteInfo.reason || '-';
      moderator = muteInfo.moderator || '-';
    }
    const created = `<t:${Math.floor(user.createdTimestamp/1000)}:R>`;
    const embed = new EmbedBuilder()
      .setTitle('Mute-Status')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord seit', value: created, inline: true },
        { name: 'Verbleibende Mute-Zeit', value: rest, inline: false },
        { name: 'Grund', value: grund, inline: false },
        { name: 'Gemutet von', value: moderator, inline: false }
      )
      .setColor('#000000')
      .setTimestamp();
  await interaction.reply({ embeds: [embed], flags: 64 });
    return;
  }

  if (interaction.commandName === 'bantime') {
    if (!interaction.member.roles.cache.has('1402043028012535890')) {
  await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Command auszuführen.', flags: 64 });
      return;
    }
    const user = interaction.options.getUser('user');
    const banInfo = banTimes.get(user.id);
    let rest = 'Nicht gebannt';
    let grund = '-';
    let moderator = '-';
    if (banInfo && banInfo.end > Date.now()) {
      const ms = banInfo.end - Date.now();
      const min = Math.floor(ms / 60000);
      const sec = Math.floor((ms % 60000) / 1000);
      rest = `${min}m ${sec}s`;
      grund = banInfo.reason || '-';
      moderator = banInfo.moderator || '-';
    }
    const created = `<t:${Math.floor(user.createdTimestamp/1000)}:R>`;
    const embed = new EmbedBuilder()
      .setTitle('Ban-Status')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${user.tag}`, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord seit', value: created, inline: true },
        { name: 'Verbleibende Ban-Zeit', value: rest, inline: false },
        { name: 'Grund', value: grund, inline: false },
        { name: 'Gebannt von', value: moderator, inline: false }
      )
      .setColor('#000000')
      .setTimestamp();
  await interaction.reply({ embeds: [embed], flags: 64 });
    return;
  }
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'dm') {
    // Nur Mitglieder mit Rolle 1403716772770742284 dürfen /dm ausführen
    if (!interaction.member.roles.cache.has('1403716772770742284')) {
  await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', flags: 64 });
      return;
    }
    const userId = interaction.options.getString('userid');
    const text = interaction.options.getString('text');
    try {
      // User kann auch außerhalb des Servers sein
      const user = await client.users.fetch(userId, { force: true });
      await user.send(text);
  await interaction.reply({ content: `Nachricht an <@${userId}> gesendet!`, flags: 64 });
    } catch (err) {
  await interaction.reply({ content: 'Konnte die Nachricht nicht senden. Prüfe die User-ID!', flags: 64 });
    }
  }

  if (interaction.commandName === 'ankündigung') {
    // Rollen-Check: Nur User mit bestimmten Rollen dürfen /ankündigung nutzen
    const erlaubteRollen = [
      '1402042622360682587',
      '1402042198358229062',
      '1402042198362689577',
      '1402042568673464360'
    ];
    if (!erlaubteRollen.some(rid => interaction.member.roles.cache.has(rid))) {
  await interaction.reply({ content: 'Du hast keine Berechtigung, diesen Befehl zu benutzen!', flags: 64 });
      return;
    }
    const titel = interaction.options.getString('titel');
    const text = interaction.options.getString('text');
    const von = interaction.user.tag;
    const channelId = '1403721803456712724';
    const channel = await client.channels.fetch(channelId);

    if (!channel) {
  await interaction.reply({ content: 'Ankündigungs-Channel nicht gefunden!', flags: 64 });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(titel)
      .setDescription(text)
      .setColor('#000000') // Schwarz
      .setFooter({ text: `Von: ${von}` })
      .setTimestamp();

    await channel.send({ content: '@everyone', embeds: [embed] });
    await channel.send('https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExamptN3N6eTBxNGR5emltcDVzZnoyYXMyNFRmdzBqc2Z4YjMyazFobiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1kadbC47cBJIdxIJJG/giphy.gif');
  await interaction.reply({ content: 'Ankündigung wurde gesendet!', flags: 64 });
  }

  if (interaction.commandName === 'kick') {
    // Nur Mitglieder mit Rolle 1402042622360682587, 1402042198358229062, 1402042198362689577 oder 1402042568673464360 dürfen kicken
    if (
      !interaction.member.roles.cache.has('1402042622360682587') &&
      !interaction.member.roles.cache.has('1402042198358229062') &&
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
    // Nur Mitglieder mit Rolle 1402042622360682587, 1402042198358229062 oder 1402042198362689577 dürfen bannen
    if (
      !interaction.member.roles.cache.has('1402042622360682587') &&
      !interaction.member.roles.cache.has('1402042198358229062') &&
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
    let endTimestamp = null;
    if (time === 'permanent') {
      durationMs = null;
      endTimestamp = null;
    } else if (time.endsWith('s')) {
      durationMs = parseInt(time) * 1000;
      endTimestamp = Date.now() + durationMs;
    } else if (time.endsWith('m')) {
      durationMs = parseInt(time) * 60 * 1000;
      endTimestamp = Date.now() + durationMs;
    } else if (time.endsWith('d')) {
      durationMs = parseInt(time) * 24 * 60 * 60 * 1000;
      endTimestamp = Date.now() + durationMs;
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
      // Speichere Ban-Info
      banTimes.set(user.id, { end: endTimestamp, reason, moderator: interaction.user.tag });
      await interaction.reply({ content: `User ${user.tag} wurde gebannt. Grund: ${reason} Dauer: ${time}`, ephemeral: true });
      if (durationMs) {
        setTimeout(async () => {
          try {
            await interaction.guild.members.unban(user.id, 'Ban abgelaufen');
            banTimes.delete(user.id);
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
    // NEU: Prüfe Rollen-Hierarchie
    const authorMember = interaction.guild.members.cache.get(interaction.user.id);
    if (member.roles.highest.position >= authorMember.roles.highest.position) {
      await interaction.reply({ content: 'Du kannst diesen User nicht muten, da er eine gleich hohe oder höhere Rolle hat als du.', ephemeral: true });
      return;
    }
    // Zeit umrechnen
    let durationMs = null;
    let endTimestamp = null;
    if (time.endsWith('s')) {
      durationMs = parseInt(time) * 1000;
      endTimestamp = Date.now() + durationMs;
    } else if (time.endsWith('m')) {
      durationMs = parseInt(time) * 60 * 1000;
      endTimestamp = Date.now() + durationMs;
    } else if (time.endsWith('h')) {
      durationMs = parseInt(time) * 60 * 60 * 1000;
      endTimestamp = Date.now() + durationMs;
    } else if (time.endsWith('d')) {
      durationMs = parseInt(time) * 24 * 60 * 60 * 1000;
      endTimestamp = Date.now() + durationMs;
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
      // Speichere Mute-Info
      muteTimes.set(user.id, { end: endTimestamp, reason, moderator: interaction.user.tag });
      await interaction.reply({ content: `User ${user.tag} wurde für ${time} gemutet. Grund: ${reason}`, ephemeral: true });
      // DM an User
      try {
        await user.send(`Du wurdest auf **${interaction.guild.name}** für ${time} gemutet.\nGrund: ${reason}`);
      } catch (e) {}
      // Timer zum Entmuten
      setTimeout(async () => {
        try {
          await member.roles.remove(muteRoleId, 'Mute abgelaufen');
          muteTimes.delete(user.id);
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


  // Handler für /member command
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
  // Versuche, die Rolle immer zu vergeben
  const roleId = '1402042099330715668';
  // ...automatische Rollenzuweisung entfernt...

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

// Setup-Befehl per Chatnachricht
// ...existing code...

// Voice-Channel-Join-Event
// ...existing code...

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

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check route for Render
app.get('/', (req, res) => {
  res.send('Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

// Ticket-Setup per Chatnachricht
client.on('messageCreate', async message => {
  if (
    message.content === '!ticket-setup' &&
    message.member &&
    message.member.permissions.has('Administrator')
  ) {
    const ticketButton = new ButtonBuilder()
      .setCustomId('ticket_open')
      .setLabel('Öffnen')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎫');

    const row = new ActionRowBuilder().addComponents(ticketButton);

    const embed = new EmbedBuilder()
      .setTitle('Ticket öffnen')
      .setDescription('Klicke auf **Öffnen**, um ein Support-Ticket zu erstellen.')
      .setColor('#000000');

    const channel = await client.channels.fetch('1403726260848296088');
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed], components: [row] });
      await message.reply({ content: 'Ticket-Panel wurde erstellt!', ephemeral: true });
    } else {
      await message.reply({ content: 'Ticket-Channel nicht gefunden!', ephemeral: true });
    }
  }
});

// Ticket-Button-Handler
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'ticket_open') {
    // Prüfe, ob schon ein Ticket für diesen User existiert
    const existingTicket = interaction.guild.channels.cache.find(
      ch =>
        ch.type === ChannelType.GuildText &&
        ch.name.startsWith(`ticket-${interaction.user.username}-`)
    );
    if (existingTicket) {
      await interaction.reply({ content: `Du hast bereits ein offenes Ticket: ${existingTicket}`, ephemeral: true });
      return;
    }

    // Erstelle das erste Ticket für den User
    const ticketChannelName = `ticket-${interaction.user.username}-1`;

    const ticketChannel = await interaction.guild.channels.create({
      name: ticketChannelName,
      type: ChannelType.GuildText,
      // parent: 'DEINE_KATEGORIE_ID',
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        },
        {
          id: '1402043028012535890',
          allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
        }
      ],
    });

    // Schließen-Button
    const closeButton = new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Schließen')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒');
    const closeRow = new ActionRowBuilder().addComponents(closeButton);

    await ticketChannel.send({
      content: `<@${interaction.user.id}> Willkommen im Ticket! Ein Supporter wird sich bald melden.`,
      components: [closeRow]
    });

    await interaction.reply({ content: `Dein Ticket wurde erstellt: ${ticketChannel}`, ephemeral: true });
    return;
  }

  if (interaction.customId === 'ticket_close') {
    // Nur Ticket-Ersteller oder Supporter dürfen schließen
    const channel = interaction.channel;
    const member = interaction.guild.members.cache.get(interaction.user.id);
    const isSupporter = member.roles.cache.has('1402043028012535890');
    // Erlaube Schließen, wenn Channelname mit ticket-username beginnt
    const isTicketOwner = channel.name.startsWith(`ticket-${interaction.user.username}`);
    if (!isSupporter && !isTicketOwner) {
      await interaction.reply({ content: 'Nur der Ticket-Ersteller oder Supporter dürfen das Ticket schließen.', ephemeral: true });
      return;
    }
    await interaction.reply({ content: 'Ticket wird geschlossen...', ephemeral: true });
    setTimeout(() => {
      channel.delete('Ticket geschlossen');
    }, 2000);
    return;
  }
});

// Einladungserkennung & Auto-Mute bei Server-Werbung
client.on('messageCreate', async message => {
  if (
    message.author.bot ||
    !message.guild ||
    !message.content
  ) return;

  // Ping-Pong mit !Ping
  if (message.content.toLowerCase() === '!ping') {
    await message.reply('Pong! 🏓');
    return;
  }

  // Discord Invite Link erkennen (discord.gg/xyz, discord.com/invite/xyz, etc.)
  const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/|discordapp\.com\/invite\/)[\w-]+/i;
  if (inviteRegex.test(message.content)) {
    try {
      await message.delete();
    } catch (e) {}

    // 1 Monat Mute (30 Tage)
    const muteRoleId = '1402053030114754572';
    const member = message.guild.members.cache.get(message.author.id);
    if (member && !member.roles.cache.has(muteRoleId)) {
      try {
        await member.roles.add(muteRoleId, 'Server Werbung');
        // Mute-Info speichern
        const durationMs = 30 * 24 * 60 * 60 * 1000; // 30 Tage
        const endTimestamp = Date.now() + durationMs;
        muteTimes.set(member.id, { end: endTimestamp, reason: 'Server Werbung', moderator: 'AutoMod' });

        // Timer zum Entmuten
        setTimeout(async () => {
          try {
            await member.roles.remove(muteRoleId, 'Mute abgelaufen');
            muteTimes.delete(member.id);
          } catch (e) {}
        }, durationMs);

        // DM an User
        try {
          await member.send('Du wurdest für 1 Monat gemutet wegen Server Werbung (Einladungslink).');
        } catch (e) {}
      } catch (e) {}
    }
  }
});

// Entferne den SlashCommandBuilder für 'role'

// Handler für !role als Chatnachricht
client.on('messageCreate', async message => {
  if (
    message.content.startsWith('!role') &&
    !message.author.bot &&
    message.guild
  ) {
    // Neue Syntax: !role @user rollenname [+ rollenname ...]
    // Beispiel: !role @Max Moderator + Supporter + VIP
    const args = message.content.split(' ').slice(1);
    if (args.length < 2) {
      await message.reply('Syntax: !role @user rollenname [+ rollenname ...]');
      return;
    }
    const userMention = args[0];
    // Restliche Argumente zu einem String zusammenfügen und nach + splitten
    const roleNames = message.content
      .split(' ')
      .slice(2)
      .join(' ')
      .split('+')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    // Hole User
    const userIdMatch = userMention.match(/^<@!?(\d+)>$/);
    if (!userIdMatch) {
      await message.reply('Bitte gib einen gültigen User an (z.B. @user).');
      return;
    }
    const userId = userIdMatch[1];
    const member = message.guild.members.cache.get(userId);
    if (!member) {
      await message.reply('User nicht auf diesem Server gefunden.');
      return;
    }

    // Hole Rollen anhand des Namens
    const roles = [];
    for (const name of roleNames) {
      const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());
      if (role) roles.push(role);
    }
    if (roles.length === 0) {
      await message.reply('Bitte gib mindestens eine gültige Rolle an.');
      return;
    }

    // Berechtigte Rollen-IDs
    let allowedRoleIds = [
      '1402042622360682587',
      '1402042198358229062',
      '1402042198362689577',
      '1402042568673464360'
    ];
    const authorMember = message.guild.members.cache.get(message.author.id);

    // Entferne Admin-Rolle explizit aus den erlaubten Rollen
    allowedRoleIds = allowedRoleIds.filter(id => id !== '1402043459539570810');

    // Finde alle erlaubten Rollen, die der User hat
    const authorAllowedRoles = authorMember.roles.cache.filter(r => allowedRoleIds.includes(r.id));
    if (!authorAllowedRoles.size) {
      await message.reply('Du hast keine Berechtigung, diesen Befehl zu benutzen!');
      return;
    }
    // Bestimme die höchste erlaubte Rolle des Users
    const authorHighestAllowed = authorAllowedRoles.reduce((highest, role) => {
      return (!highest || role.position > highest.position) ? role : highest;
    }, null);

    // Zusätzliche Prüfung: Keine Rolle mit gleicher/höherer Position als eigene höchste Rolle
    const forbiddenRole = roles.find(role => role.position >= authorMember.roles.highest.position);
    if (forbiddenRole) {
      await message.reply(`Du darfst die Rolle "${forbiddenRole.name}" nicht vergeben oder entfernen, da sie gleich oder höher als deine höchste Rolle ist.`);
      return;
    }

    // IDs der verbotenen Rollen für 1402043459539570810
    const forbiddenForAdmin = [
      '1402042198358229062',
      '1402042622360682587',
      '1402042198362689577',
      '1402042568673464360',
      '1402043402907811971',
      '1402043028012535890'
    ];

    // Zusätzliche Absicherung: Rolle 1402043459539570810 darf sich selbst oder anderen NIE die verbotenen Rollen geben/entfernen
    if (authorHighestAllowed.id === '1402043459539570810') {
      const forbiddenRole = roles.find(role => forbiddenForAdmin.includes(role.id));
      if (forbiddenRole) {
        await message.reply(`Du darfst die Rolle "${forbiddenRole.name}" weder dir selbst noch anderen geben oder entfernen.`);
        return;
      }
    }

    // User darf nur Rollen vergeben/entfernen, die UNTER seiner höchsten erlaubten Rolle liegen
    // Zusätzliche Absicherung: Rolle 1402043459539570810 darf niemals Rollen mit gleicher oder höherer Position vergeben/entfernen
    let notAllowed = roles.find(role => role.position >= authorHighestAllowed.position);
    // Admin darf sich selbst keine höhere oder gleich hohe Rolle geben
    if (!notAllowed && authorHighestAllowed.id === '1402043459539570810') {
      if (member.id === authorMember.id) {
        notAllowed = roles.find(role => role.position >= authorHighestAllowed.position);
        if (notAllowed) {
          await message.reply(`Du darfst dir selbst die Rolle "${notAllowed.name}" nicht geben oder entfernen, da sie gleich oder höher als deine höchste Berechtigungsrolle ist.`);
          return;
        }
      }
    }
    if (notAllowed) {
      await message.reply(`Du darfst die Rolle "${notAllowed.name}" nicht vergeben oder entfernen, da sie gleich oder höher als deine höchste Berechtigungsrolle ist.`);
      return;
    }

    let added = [];
    let removed = [];
    for (const role of roles) {
      if (member.roles.cache.has(role.id)) {
        await member.roles.remove(role, `Entfernt durch ${message.author.tag} via !role`);
        removed.push(role.name);
      } else {
        await member.roles.add(role, `Hinzugefügt durch ${message.author.tag} via !role`);
        added.push(role.name);
      }
    }

    let msg = '';
    if (added.length) msg += `Hinzugefügt: ${added.join(', ')}\n`;
    if (removed.length) msg += `Entfernt: ${removed.join(', ')}\n`;
    if (!msg) msg = 'Keine gültigen Rollen gefunden oder geändert.';

    await message.reply(msg);
  }
});

// Anti-Spam Tracking
const spamTracker = new Map(); // userId -> [timestamps]

client.on('messageCreate', async message => {
  // Anti-Spam: 10 Nachrichten in 10 Sekunden = 20 Minuten Mute
  if (!message.author.bot && message.guild && message.content) {
    const now = Date.now();
    const userId = message.author.id;
    const muteRoleId = '1402053030114754572';

    // Hole bisherigen Timestamps
    let timestamps = spamTracker.get(userId) || [];
    // Entferne alle älter als 10 Sekunden
    timestamps = timestamps.filter(ts => now - ts < 10000);
    timestamps.push(now);
    spamTracker.set(userId, timestamps);

    if (timestamps.length >= 10) {
      // Mute nur, wenn User nicht schon gemutet ist
      const member = message.guild.members.cache.get(userId);
      if (member && !member.roles.cache.has(muteRoleId)) {
        try {
          await member.roles.add(muteRoleId, 'Spam (10 Nachrichten in 10 Sekunden)');
          const durationMs = 20 * 60 * 1000; // 20 Minuten
          const endTimestamp = Date.now() + durationMs;
          muteTimes.set(userId, { end: endTimestamp, reason: 'Spam', moderator: 'AutoMod' });

          setTimeout(async () => {
            try {
              await member.roles.remove(muteRoleId, 'Mute abgelaufen');
              muteTimes.delete(userId);
            } catch (e) {}
          }, durationMs);

          try {
            await member.send('Du wurdest für 20 Minuten gemutet wegen Spam (10 Nachrichten in 10 Sekunden).');
          } catch (e) {}

          // Optional: Modlog-Eintrag
          modlog.push({ userId, type: 'mute', reason: 'Spam', time: Date.now() });
        } catch (e) {}
      }
      // Tracker zurücksetzen
      spamTracker.set(userId, []);
    }
  }

  // !modlog @user Handler
  if (
    message.content.startsWith('!modlog') &&
    !message.author.bot &&
    message.guild
  ) {
    const args = message.content.split(' ').slice(1);
    if (args.length < 1) {
      await message.reply('Syntax: !modlog @user');
      return;
    }
    const userMention = args[0];
    const userIdMatch = userMention.match(/^<@!?(\d+)>$/);
    if (!userIdMatch) {
      await message.reply('Bitte gib einen gültigen User an (z.B. @user).');
      return;
    }
    const userId = userIdMatch[1];
    // Hole User-Objekt
    let user;
    try {
      user = await client.users.fetch(userId);
    } catch (e) {
      await message.reply('User nicht gefunden.');
      return;
    }
    // Filtere Modlog-Einträge des letzten Jahres
    const since = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const actions = modlog
      .filter(log => log.userId === userId && log.time >= since)
      .map(log =>
        `**${log.type.toUpperCase()}**\nGrund: ${log.reason}\nVon: ${log.moderator || '-'}\nZeit: <t:${Math.floor(log.time / 1000)}:R>`
      )
      .join('\n\n') || 'Keine Aktionen im letzten Jahr.';

    const embed = new EmbedBuilder()
      .setTitle(`Modlog für ${user.tag}`)
      .setColor('#000000')
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'User', value: user.tag, inline: true },
        { name: 'ID', value: user.id, inline: true },
        { name: 'Discord seit', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Mod-Aktionen (letztes Jahr)', value: actions, inline: false }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    return;
  }
});




