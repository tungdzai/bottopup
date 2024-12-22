import {config} from "dotenv";
import {promises as fs} from "fs";
config();
export const minWin = process.env.MIN_WINER;
export const maxWin = process.env.MAX_WINER;
export async function getRandomTime(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}
export async function getRandomProvinceCode() {
    const provinceCode=['89','24','06','95','27','77','83','52','70','15']
    const randomIndex = Math.floor(Math.random() * provinceCode.length);
    return provinceCode[randomIndex];
}

export async function generateRandomUserName() {
    const lastNames = ["HNguyễn", "HTrần", "HLê", "HPhạm", "HHoàng", "HVũ", "HVõ", "HĐặng"];
    const middleNames = ["Văn", "Hồng", "Minh", "Quang", "Thanh", "Anh"];
    const firstNames = ["THùng", "TLan", "TAnh", "TBình", "TDũng", "TSơn", "TPhương"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    return `${getRandomElement(lastNames)} ${getRandomElement(middleNames)} ${getRandomElement(firstNames)}`;
}

export async function generateRandomPhone() {
    const prefixes = ["096", "097", "098", "086", "032", "034", "035", "036"];

    function getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function generateRandomDigits(length) {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += Math.floor(Math.random() * 10);
        }
        return result;
    }

    return `${getRandomElement(prefixes)}${generateRandomDigits(7)}`;
}

export async function readCodesFromFile(path) {
    try {
        const data = await fs.readFile(path, 'utf-8');
        return data.split('\n').map(code => code.trim()).filter(code => code);
    } catch (error) {
        console.error('Lỗi khi đọc file:', error);
        return [];
    }
}

export async function writeCodesToFile(filePath, codes) {
    try {
        // Gộp danh sách mã thành chuỗi, mỗi mã một dòng
        const data = codes.join('\n');
        // Ghi đè nội dung vào file
        await fs.writeFile(filePath, data, 'utf8');
        console.log(`Đã cập nhật file ${filePath}.`);
    } catch (error) {
        console.error(`Lỗi ghi file ${filePath}:`, error);
    }
}