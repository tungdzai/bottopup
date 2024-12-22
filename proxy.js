import {config} from "dotenv";
import {getProxiesWw} from "./wwproxy.js";
import {getProxyVN} from "./proxyVN.js";
import {HttpsProxyAgent} from "https-proxy-agent";
config();

export async function getProxiesData() {
    let dataProxies
    // dataProxies = await getProxiesWw()
    if (!dataProxies || dataProxies.length === 0) {
        console.log(` Lấy proxy từ proxy vn .`)
        dataProxies = await getProxyVN();
    }
    console.log(`Số proxy hoạt động: ${dataProxies.length}`);
    return dataProxies;
}
export async function httpsProxyAgent(proxy) {
    let proxyHost, proxyPort, proxyUser, proxyPassword;

    if (typeof proxy === 'string') {
        const proxyParts = proxy.split(':');
        if (proxyParts.length === 2) {
            [proxyHost, proxyPort] = proxyParts;
            proxyUser = '';
            proxyPassword = '';
        } else if (proxyParts.length === 4) {
            [proxyHost, proxyPort, proxyUser, proxyPassword] = proxyParts;
        } else {
            console.error('Proxy khong đúng định dạng');
            return null;
        }
    } else {
        console.error('Không tồn tại proxy kiểm tra lại ');
        return null;
    }

    const proxyUrl = `http://${proxyUser}:${proxyPassword}@${proxyHost}:${proxyPort}`;
    return new HttpsProxyAgent(proxyUrl);
}
export async function getRandomProxies(proxies, count) {
    const shuffled = proxies.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

