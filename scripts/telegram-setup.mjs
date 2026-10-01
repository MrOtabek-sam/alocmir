// Finds your Telegram chat ID and sends a test message.
// 1. Create a bot with @BotFather and copy its token.
// 2. Open your bot in Telegram and press Start (or add it to a group and send any message there).
// 3. Run: TELEGRAM_BOT_TOKEN=... npm run telegram:setup
//    (PowerShell: $env:TELEGRAM_BOT_TOKEN="..."; npm run telegram:setup)
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("Set TELEGRAM_BOT_TOKEN first (from @BotFather).");
  process.exit(1);
}
const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  }).then((r) => r.json());

const me = await api("getMe");
if (!me.ok) {
  console.error("Token rejected by Telegram:", me.description);
  process.exit(1);
}
console.log(`Bot: @${me.result.username}`);

const updates = await api("getUpdates");
const chats = new Map();
for (const u of updates.result ?? []) {
  const chat = (u.message ?? u.channel_post ?? u.my_chat_member)?.chat;
  if (chat) chats.set(chat.id, chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" ") ?? chat.username);
}
if (!chats.size) {
  console.log(`No chats yet. Open https://t.me/${me.result.username}, press Start, then run this again.`);
  process.exit(0);
}
for (const [id, name] of chats) {
  const sent = await api("sendMessage", { chat_id: id, text: "✅ Alcomir notifications are connected. New orders will appear here." });
  console.log(`${sent.ok ? "Test message sent to" : "Could not message"} ${name}: TELEGRAM_CHAT_ID=${id}`);
}
console.log("\nAdd TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to .env (and Vercel > Settings > Environment Variables).");
console.log("Several chats: TELEGRAM_CHAT_ID=111,222");
