import {sendTelegramMessage} from "./telegram.js";
import {checkPhoneReward, getHome, spinLucky} from "./api.js";
import {getProxiesData, getRandomProxies, httpsProxyAgent} from "./proxy.js";
import {
    getRandomTime,
    writeCodesToFile
} from './handlers.js';
import fs from 'fs/promises';
export async function runCode(phoneList, currentGame, currentCodes, requestedCount, batchSize,maxWin) {
    let requestData;
    const filePath = currentGame === 'topkid' ? './data/topKid.txt' : './data/yogurt.txt';
    const errorCodes = [];
    if (currentGame === 'topkid') {
        requestData = {
            checkCode: 'https://quatangtopkid.thmilk.vn/Home/CheckCode',
            lucky: 'https://quatangtopkid.thmilk.vn/Home/IndexAjax',
            host: 'quatangtopkid.thmilk.vn',
            origin: 'https://quatangtopkid.thmilk.vn',
            referer: 'https://quatangtopkid.thmilk.vn/'
        };
    } else {
        requestData = {
            checkCode: 'https://quatangyogurt.thmilk.vn/Home/CheckCode',
            lucky: 'https://quatangyogurt.thmilk.vn/Home/IndexAjax',
            host: 'quatangyogurt.thmilk.vn',
            origin: 'https://quatangyogurt.thmilk.vn',
            referer: 'https://quatangyogurt.thmilk.vn/'
        };

    }

    const codesToProcess = currentCodes.splice(0, requestedCount);
    await sendTelegramMessage(`Đã lấy ${requestedCount} mã để chơi, số lượng mã còn lại: ${currentCodes.length}`);

    const allProxies = await getProxiesData();

    for (let i = 0; i < codesToProcess.length; i += batchSize) {
        const batchProxies = await getRandomProxies(allProxies, batchSize);

        const batchGift = codesToProcess.slice(i, i + batchSize);

        const pairedProxiesAndGifts = batchGift.map((gift, index) => ({
            gift,
            proxy: batchProxies[index % batchProxies.length],
        }));
        console.log(`Chạy luồng ${Math.floor(i / batchSize) + 1}`);


        const batchPromises = pairedProxiesAndGifts.map(async ({gift, proxy}) => {
            if (!gift.startsWith('TY') && !gift.startsWith('YE')) {
                console.log(`Bỏ qua mã ${gift} vì không khớp với TY hoặc YE.`);
                return;
            }
            const agent = await httpsProxyAgent(proxy);
            if (!agent) {
                // If no agent, skip this iteration and notify the bot
                const message = `Lỗi proxy hoặc agent không hợp lệ cho mã ${gift}`;
                await sendTelegramMessage(message);
                console.log(`Lỗi proxy hoặc agent không hợp lệ cho mã ${gift}`);
                errorCodes.push(gift);
                return;
            }
            const responseHome = await getHome(requestData, agent);
            await getRandomTime(3000,5000)
            if (responseHome) {
                const token = responseHome.token;
                const cookies = responseHome.cookies;

                // const phoneNumber = phoneList[Math.floor(Math.random() * phoneList.length)];
                const resultReward = await checkPhoneReward(phoneList, requestData, maxWin);
                if (resultReward) {
                    const resultSpin = await spinLucky(requestData, gift, resultReward.phone, token, cookies, agent);
                    if (resultSpin) {
                        const type = resultSpin.Type;
                        const html = resultSpin.HtmlGiai;
                        if (type !== 'notWin' && html) {
                            const regex = /<div class="win-product">([\s\S]*?)<\/div>/g;
                            const winProduct = [...(html.matchAll(regex) || [])].map(match => match[1].trim().replace(/<br\s*\/?>/gi, ' '));
                            const messageText = `${resultReward.phone} ${resultReward.win} ${gift} ${winProduct}`
                            await sendTelegramMessage(messageText);
                        }else {
                            const messageNotWin=`${resultReward.phone} ${resultReward.win} ${gift} ${type} ${resultSpin.Message}`;
                            console.log(messageNotWin);
                        }
                    }else {
                        console.log(`spinLucky lỗi tai ${gift} ${resultSpin}`);
                        errorCodes.push(gift);
                    }
                } else {
                    console.log(`CheckPhoneReward lỗi tai ${gift}`);
                    errorCodes.push(gift);
                }

            } else {
                console.log(`GetHome lỗi tại ${gift}`);
                errorCodes.push(gift);
            }
        });
        await Promise.all(batchPromises);
        await getRandomTime(1000,3000)
    }

    if (errorCodes.length > 0) {
        await fs.appendFile('./data/errors.txt', errorCodes.join('\n') + '\n');
        await sendTelegramMessage(`Đã lưu ${errorCodes.length} mã lỗi vào file.`);
    }
    await sendTelegramMessage(`Dã thực hiện chạy xong ${requestedCount} mã`);
    await writeCodesToFile(filePath, currentCodes);
}