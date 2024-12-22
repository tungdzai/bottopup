import axios from "axios";
import * as cheerio from 'cheerio';
import {generateRandomUserName, getRandomProvinceCode, maxWin, minWin} from "./handlers.js";
export async function getHome(requestData, agent) {
    try {
        const response = await axios.get(requestData.origin, {
            headers: {
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/6.0 (Linux; Android 10; K) AppleWebKit/527.36 (KHTML, like Gecko) Chrome/134.0.0.0 Mobile Safari/527.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1'
            },
            withCredentials: true,
            httpAgent: agent,
            httpsAgent: agent,
        });
        const html = response.data;
        const $ = cheerio.load(html);
        const token = $('input[name="__RequestVerificationToken"]').val();
        const cookies = response.headers['set-cookie'];
        return {
            token,
            cookies
        }
    } catch (error) {
        console.error('Lỗi getHome:', error.status || error.message);
        return null;
    }
}
export async function checkPhoneReward(phoneList, requestData, token, cookies, agent, maxWin, minWin, retries = 20) {
    if (retries < 0) {
        return null
    }
    try {
        const phoneNumber = phoneList[Math.floor(Math.random() * phoneList.length)];
        const response = await axios.get(`${requestData.origin}/Home/ListGiai?SearchString=${phoneNumber}`, {
            headers: {
                'RequestVerificationToken': token,
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1',
                'Cookie': cookies,
            },
            httpAgent: agent,
            httpsAgent: agent,
        });

        // console.log('Response Headers:', response.headers);
        // console.log('Response Data:', response.data);

        const html = response.data;
        const $ = cheerio.load(html);
        const winners = [];
        $('.table-responsive.d-none.d-lg-block table tbody tr').each((index, element) => {
            const row = $(element);
            const winner = {
                stt: row.find('td').eq(0).text().trim(),
                prize: row.find('td').eq(1).text().trim(),
                name: row.find('td').eq(2).text().trim(),
                phone: row.find('td').eq(3).text().trim(),
                address: row.find('td').eq(4).text().trim(),
            };
            winners.push(winner);
        });
        if (winners.length < maxWin && winners.length >= minWin) {
            return {
                win: winners.length,
                phone: phoneNumber
            }
        }
        console.log(`${phoneNumber} quá số lần ${requestData.referer}`)
        return await checkPhoneReward(phoneList, requestData, token, cookies, agent,maxWin,minWin, retries - 1)
    } catch (error) {
        console.error('Lỗi checkPhoneReward ', error.status || error.message);
        return await checkPhoneReward(phoneList, requestData, token, cookies, agent,maxWin,minWin, retries - 1);
    }
}
export async function spinLucky(requestData,gift, phone, token, cookie, agent) {
    try {
        const randomName = await generateRandomUserName();
        const nameParts = randomName.split(' ');
        const lastName = nameParts[0];
        const middleName = nameParts.slice(1, -1).join(' ');
        const firstName = nameParts[nameParts.length - 1];

        const postLucky = `Name=${lastName}+${middleName}+${firstName}&Phone=${phone}&ProvinceCode=${await getRandomProvinceCode()}&Code=${gift}`;

        const responseLucky = await axios.post(requestData.lucky, postLucky, {
            headers: {
                'RequestVerificationToken': token,
                'Host': requestData.host,
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'sec-ch-ua-mobile': '?1',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                'sec-ch-ua-platform': '"Android"',
                'origin': requestData.origin,
                'sec-fetch-site': 'same-origin',
                'sec-fetch-mode': 'cors',
                'sec-fetch-dest': 'empty',
                'referer': requestData.referer,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': 'vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5',
                'priority': 'u=1',
                'Cookie': cookie,
            },
            httpAgent: agent,
            httpsAgent: agent,
        });
        return responseLucky.data;
    } catch (error) {
        console.error('Lỗi spinLucky:', error.status || error.message);
        return null
    }

}

