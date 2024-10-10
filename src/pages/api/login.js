// src/pages/api/login.js
import puppeteer from 'puppeteer';

let captchaPage = null;

// src/pages/api/login.js
async function iniciarSesionConUsuario(nombreUsuario, contrasena) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    captchaPage = page; // Guardar la página para usar después

    try {
        // Navegar a la página de inicio de sesión de TikTok
        await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle2' });

        // Seleccionar la opción de "Usar teléfono/correo/nombre de usuario"
        await page.waitForSelector('div.tiktok-17hparj-DivBoxContainer.e1cgu1qo0', { timeout: 15000 });
        const loginOptions = await page.$$('div.tiktok-17hparj-DivBoxContainer.e1cgu1qo0');

        let usuarioButton = null;
        for (const option of loginOptions) {
            const text = await option.evaluate(el => el.textContent);
            if (text.includes('Usar teléfono/correo/nombre de usuario')) {
                usuarioButton = option;
                break;
            }
        }

        if (usuarioButton) {
            await usuarioButton.click();
        } else {
            throw new Error('No se encontró la opción de inicio de sesión con usuario.');
        }

        // Esperar y hacer clic en el enlace "Iniciar sesión con un correo electrónico o nombre de usuario"
        await page.waitForSelector('a[href="/login/phone-or-email/email"]', { timeout: 15000 });
        await page.click('a[href="/login/phone-or-email/email"]');

        // Introducir el nombre de usuario y la contraseña
        await page.waitForSelector('input[name="username"]', { timeout: 15000 });
        await page.type('input[name="username"]', nombreUsuario, { delay: 100 });

        await page.waitForSelector('input[type="password"]', { timeout: 15000 });
        await page.type('input[type="password"]', contrasena, { delay: 100 });

        // Enviar el formulario
        await page.keyboard.press('Enter');

        // Esperar que aparezca el captcha utilizando un selector más genérico
        try {
            await page.waitForSelector('[class*="captcha"]', { timeout: 15000 });
            console.log('Captcha encontrado. Completa el captcha manualmente.');

            // Pausar aquí para permitir que el usuario resuelva el captcha manualmente
            return { captchaRequired: true, message: 'Captcha encontrado. Completa el captcha manualmente en el navegador.' };
        } catch (err) {
            console.log('No se encontró captcha.');
            return { success: true };
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        await browser.close();
        return { success: false, error: error.message };
    }
}


async function continuarProceso() {
    if (captchaPage) {
        try {
            // Esperar un tiempo para que el usuario complete el captcha manualmente
            await new Promise(resolve => setTimeout(resolve, 10)); // Esperar 10 segundos, ajusta el tiempo según sea necesario
            console.log('Intentando continuar después del captcha manual.');
            return { success: true, message: 'Captcha resuelto o intentado manualmente' };
        } catch (error) {
            console.error('Error al continuar después del captcha:', error);
            return { success: false, error: error.message };
        }
    } else {
        return { success: false, error: 'No se encontró la página del captcha.' };
    }
}


export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { username, password, resolveCaptcha } = req.body;

        if (resolveCaptcha) {
            // El usuario ha resuelto el captcha manualmente, continuar el proceso
            const result = await continuarProceso();
            res.status(200).json(result);
        } else {
            // Iniciar sesión y capturar el captcha
            const result = await iniciarSesionConUsuario(username, password);
            res.status(200).json(result);
        }
    } else {
        res.status(405).json({ success: false, message: 'Método no permitido' });
    }
}
