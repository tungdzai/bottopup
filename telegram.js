import {config} from "dotenv";
import TelegramBot from "node-telegram-bot-api";
config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.ID_TELEGRAM;

export const bot = new TelegramBot(token, {polling: true});

export async function sendTelegramMessage(message) {
    try {
        await bot.sendMessage(chatId, message);
    } catch (error) {
        console.error(`Lỗi gửi tin nhắn đến Telegram (chatId: ${chatId}):`, error);
    }
}

