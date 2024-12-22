import {sendTelegramMessage} from "./telegram.js";
import {checkPhoneReward, getHome, spinLucky} from "./api.js";
import {getProxiesData, getRandomProxies, httpsProxyAgent} from "./proxy.js";
import {
    maxWin,
    minWin,
    getRandomTime,
    readCodesFromFile,
    writeCodesToFile
} from './handlers.js';

export async function runCode(phoneList, currentGame, currentCodes, requestedCount, batchSize) {
    let requestData;
    const filePath = currentGame === 'topkid' ? './data/topKid.txt' : './data/yogurt.txt';
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
    await writeCodesToFile(filePath, currentCodes);

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
            const responseHome = await getHome(requestData, agent);

            if (responseHome) {
                const token = responseHome.token;
                const cookies = responseHome.cookies;

                const resultReward = await checkPhoneReward(phoneList, requestData, token, cookies, agent, maxWin, minWin);
                if (resultReward) {
                    const resultSpin = await spinLucky(requestData, gift, resultReward.phone, token, cookies, agent);
                    if (resultSpin) {
                        const type = resultSpin.Type;
                        console.log(`${resultReward.phone} ${resultReward.win} ${gift} ${type} ${resultSpin.Message}`);
                        const html = resultSpin.HtmlGiai;
                        if (type !== 'notWin' && html) {
                            const regex = /<div class="win-product">([\s\S]*?)<\/div>/g;
                            const winProduct = [...(html.matchAll(regex) || [])].map(match => match[1].trim().replace(/<br\s*\/?>/gi, ' '));
                            const messageText = `${resultReward.phone} ${gift} ${winProduct}`
                            await sendTelegramMessage(messageText);
                        }
                    }
                } else {
                    console.log(`Kiểm tra phone bị lỗi`)
                }

            } else {
                console.log(`Đăng nhập lỗi tại ${gift}`)
            }
        });
        await Promise.all(batchPromises);
        await getRandomTime(2000, 3000);
    }

    await sendTelegramMessage(`Dã thực hiện chạy xong ${requestedCount} mã`)

}