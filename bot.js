import {bot, sendTelegramMessage} from "./telegram.js";
import fs from 'fs/promises';
import {runCode} from "./spin.js";
import {readCodesFromFile} from "./handlers.js";

let phoneList = []; // Danh sách số điện thoại
let currentMode = null; // Xác định chế độ hiện tại của bot
let currentGame = null; // Xác định loại trò chơi
let currentCodes = []; // Danh sách mã giảm
let requestedCount = null; // Số lượng mã muốn chơi
let batchSize = null; // Số lượng mã chơi game / giây;
let maxWin = null;


bot.on("message", async (msg) => {
    const messageText = msg.text;
    if (messageText === '/startgame') {
        currentMode = 'startgame';
        currentGame = null;
        await sendTelegramMessage("Chế độ chơi game được kích hoạt. Vui lòng nhập danh sách số điện thoại.");
    } else if (messageText === '/addgift') {
        currentMode = 'addgift';
        await sendTelegramMessage("Chế độ thêm mã đã được kích hoạt. Vui lòng gửi danh sách mã quà tặng.");
    } else if (messageText === '/stop') {
        currentMode = 'stop';
        await sendTelegramMessage("Chế độ dừng chơi đã kích hoạt.");
        phoneList = [];
        currentMode = null;
        currentGame = null;
        currentCodes = null;
        requestedCount = null;
        maxWin = null

    } else if (currentMode === 'startgame' && phoneList.length === 0 && !currentGame) {
        const phoneNumbers = messageText
            .split('\n')
            .map((phone) => phone.trim())
            .map((phone) => {
                if (/^\d{9}$/.test(phone)) {
                    return '0' + phone;
                }
                return phone;
            })
            .filter((phone) => /^\d{10}$/.test(phone));

        if (phoneNumbers.length > 0) {
            phoneList = [...phoneNumbers];
            await sendTelegramMessage(`Tổng số điện thoại tham gia:${phoneNumbers.length}`);
            await sendTelegramMessage("Vui lòng chọn loại mã /Topkid hoặc /Yogurt ");
        } else {
            await sendTelegramMessage("Vui lòng gửi danh sách số điện thoại hợp lệ ");
        }
    } else if (currentMode === 'startgame' && phoneList.length > 0 && !currentGame) {
        if (messageText === '/Topkid') {
            currentGame = 'topkid';
            await sendTelegramMessage("Bạn đã chọn chơi Topkid.");
        } else if (messageText === '/Yogurt') {
            currentGame = 'yogurt';
            await sendTelegramMessage("Bạn đã chọn chơi Yogurt.");
        } else {
            await sendTelegramMessage("Vui lòng gửi /Topkid hoặc /Yogurt để chọn chế độ chơi.");
        }

        if (currentGame) {
            const filePath = currentGame === 'topkid' ? './data/topKid.txt' : './data/yogurt.txt';
            currentCodes = await readCodesFromFile(filePath);

            if (currentCodes.length === 0) {
                await sendTelegramMessage(`Không có mã ${currentGame} nào để chơi. Vui lòng thêm mã.`);
                currentMode = 'addgift';
            } else {
                await sendTelegramMessage(`Có ${currentCodes.length} mã ${currentGame} khả dụng. Vui lòng nhập số lượng mã muốn sử dụng.`);
            }
        }
    } else if (currentMode === 'startgame' && phoneList.length > 0 && currentGame && currentCodes.length > 0 && !requestedCount) {
        requestedCount = parseInt(messageText);
        if (!isNaN(requestedCount) && requestedCount > 0) {
            await sendTelegramMessage(`Nhập số mã muốn chơi trên 1 giây `);
        } else {
            await sendTelegramMessage("Vui lòng nhập số lượng mã hợp lệ (số nguyên dương).");
        }
    } else if (currentMode === 'startgame' && phoneList.length > 0 && currentGame && currentCodes.length > 0 && requestedCount && !batchSize) {
        batchSize = parseInt(messageText);
        if (!isNaN(batchSize) && batchSize > 0) {
            await sendTelegramMessage("Vui lòng nhập ngưỡng trúng thưởng");
        } else {
            await sendTelegramMessage("Vui lòng nhập số hợp lệ (số nguyên dương).");
            batchSize=null
        }
    }else if (currentMode === 'startgame' && phoneList.length > 0 && currentGame && currentCodes.length > 0 && requestedCount && batchSize){
        maxWin=parseInt(messageText)
        if (!isNaN(maxWin) && maxWin > 0) {
            await sendTelegramMessage(`Thông tin trò chơi \n Tổng số điện thoại tham gia : ${phoneList.length} \n Loại quay thưởng : ${currentGame} \n Số lượng mã quay: ${requestedCount} \n Tốc độ(mã/s): ${batchSize} \n Ngưỡng thắng ${maxWin}`);
            await runCode(phoneList, currentGame, currentCodes, requestedCount, batchSize,maxWin);
            phoneList = [];
            currentMode = null;
            currentGame = null;
            currentCodes = [];
            requestedCount = null;
            batchSize = null;
            maxWin = null
        } else {
            await sendTelegramMessage("Vui lòng nhập số hợp lệ (số nguyên dương).");
            maxWin=null;
        }
    }
    else if (currentMode === 'addgift') {
        const gifts = messageText
            .split('\n')
            .map((gift) => gift.trim())
            .filter((gift) => /^YE|TY/.test(gift));

        const yogurtGifts = gifts.filter((gift) => gift.startsWith('YE'));
        const topKidGifts = gifts.filter((gift) => gift.startsWith('TY'));

        if (yogurtGifts.length > 0) {
            await fs.appendFile('./data/yogurt.txt', yogurtGifts.join('\n') + '\n');
        }
        if (topKidGifts.length > 0) {
            await fs.appendFile('./data/topKid.txt', topKidGifts.join('\n') + '\n');
        }

        await sendTelegramMessage(`Đã lưu:\n${yogurtGifts.length} mã vào yogurt.txt\n${topKidGifts.length} mã vào topkid.txt`);

    } else {
        await sendTelegramMessage(`Chưa chọn chế độ chơi`);
    }
});
