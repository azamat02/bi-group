const { Scenes, Markup } = require('telegraf');
const {saveMessage} = require("../db/models");
const {broadcast} = require("../webhooks/websocket");
const pool = require("../db");

const translations = {
    ru: {
        chooseOption: 'Выберите действие',
        greeting: (name) => `Привет, ${name}! 👋\nДобро пожаловать в официального бота BI Group. Чем мы можем помочь?`,
        companyInfo: 'ℹ️ Информация о компании',
        addresses: '🗺 Наши адреса',
        call: '📞 Позвонить',
        chatWithConsultant: '💬 Чат с консультантом',
        socialMedia: '🤳 Социальные сети',
        suggestions: '💡 Ваши предложения по улучшению бота',
        viewProperties: '🏘 Посмотреть доступные ЖК',
        propertiesButton: 'Посмотреть ЖК',
        salesDepartment: 'Отдел продаж\nАдрес: ул. Шахриабад, 69, Мирзо-Улугбекский район, массив Ялангач',
        centralSalesDepartment: 'Центральный отдел продаж\nАдрес: ул. Нукус 91/1',
        yandexMapsLink: 'Ссылка на Яндекс Карты 🗺',
        twoGisMapsLink: 'Ссылка на карту 2GIS 🗺',
        companyDesc: `
*BI Group* - международный инновационный девелоперский холдинг, лидер на рынке недвижимости Казахстана.
- 28 лет на рынке
- +400 тыс жителей
- Топ 3 в СНГ по объему реализуемой недвижимости
- 8 городов
- +110 текущих проектов
        `,
        callPrompt: 'Хотите совершить звонок?',
        callButton: 'Позвонить в колл-центр',
        socialNetworks: 'Наши социальные сети 👇',
        suggestionPrompt: 'Напишите любые предложения по улучшению работы бота:',
        suggestionThanks: 'Спасибо за ваше предложение!',
        chatWelcome: 'Добро пожаловать в чат поддержки! Чтобы мы могли вам помочь, пожалуйста, сначала напишите ваше сообщение или опишите вопрос. Сразу после того, как мы получим ваше обращение, наш консультант свяжется с вами! Введите /exit для выхода.',
        chatExit: 'Вы вышли из чата с консультантом.',
        textOnly: 'Пожалуйста, отправляйте только текстовые сообщения.'
    },
    uz: {
        chooseOption: 'Harakatni tanlang',
        greeting: (name) => `Salom, ${name}! 👋\nBI Group rasmiy botiga xush kelibsiz. Qanday yordam bera olishimiz mumkin?`,
        companyInfo: 'ℹ️ Kompaniya haqida ma\'lumot',
        addresses: '🗺 Bizning manzillar',
        call: '📞 Qo\'ng\'iroq qilish',
        chatWithConsultant: '💬 Konsultant bilan suhbat',
        socialMedia: '🤳 Ijtimoiy tarmoqlar',
        suggestions: '💡 Botni yaxshilash takliflaringiz',
        viewProperties: '🏘 Mavjud uy-joy komplekslarni ko\'rish',
        propertiesButton: 'Uy-joy komplekslarini ko\'rish',
        salesDepartment: 'Savdo bo‘limi\nManzil: Shahriobod ko‘chasi, 69, Mirzo Ulug‘bek tumanı, Yalang‘och massivi',
        centralSalesDepartment: 'Markaziy savdo bo‘limi\nManzil: Nukus ko‘chasi 91/1',
        yandexMapsLink: 'Yandex Xaritalar havolasi 🗺',
        twoGisMapsLink: '2GIS Xaritasiga havola 🗺',
        companyDesc: `
*BI Group* - xalqaro innovatsion rivojlanayotgan holding, Qozog‘iston ko‘chmas mulk bozorida yetakchi.
- Bozorda 28 yil
- +400 ming aholi
- MDH bo‘yicha realizatsiya qilingan ko‘chmas mulk bo‘yicha top 3
- 8 shahar
- +110 joriy loyihalar
        `,
        callPrompt: 'Qo\'ng\'iroq qilishni xohlaysizmi?',
        callButton: 'Call-markazga qo\'ng\'iroq qiling',
        socialNetworks: 'Bizning ijtimoiy tarmoqlar 👇',
        suggestionPrompt: 'Bot ishlashini yaxshilash bo\'yicha takliflaringizni yozing:',
        suggestionThanks: 'Taklifingiz uchun rahmat!',
        chatWelcome: 'Qo‘llab-quvvatlash chatiga xush kelibsiz! Bizga yordam berishimiz uchun, iltimos, avval xabaringizni yozing yoki savolingizni tavsiflang. Xabaringizni olganimizdan darhol keyin, maslahatchimiz siz bilan bog‘lanadi! Chiqish uchun /exit buyrug‘ini kiriting.',
        chatExit: 'Siz konsultant bilan bo‘lgan chatdan chiqdingiz.',
        textOnly: 'Iltimos, faqat matnli xabarlar yuboring.'
    }
};

function setupScenes(stage) {
    const chatScene = new Scenes.BaseScene('chatScene');
    const suggestionScene = new Scenes.BaseScene('suggestionScene');

    suggestionScene.enter((ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].suggestionPrompt);
    });
    suggestionScene.on('text', async (ctx) => {
        const suggestion = ctx.message.text;
        const userId = ctx.from.id;
        const { username, first_name, last_name } = ctx.from;

        // Save the suggestion in the database
        await pool.query('INSERT INTO suggestions(user_id, username, first_name, last_name, suggestion) VALUES($1, $2, $3, $4, $5)', [userId, username, first_name, last_name, suggestion]);

        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].suggestionThanks);
        ctx.scene.leave();
    });
    chatScene.enter((ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].chatWelcome, Markup.keyboard([
            [translations[language].chatExit]
        ]).resize());
    });
    chatScene.on('text', async (ctx) => {
        const text = ctx.message.text;
        const language = ctx.session.language || 'ru';
        if (text === '/exit' || text === translations[language].chatExit) {
            ctx.reply(translations[language].chatExit);
            ctx.reply(translations[language].chooseOption, Markup.keyboard([
                [translations[language].companyInfo],
                [translations[language].addresses],
                [translations[language].call],
                [translations[language].chatWithConsultant],
                [translations[language].socialMedia],
                [translations[language].suggestions],
            ]).resize());
            ctx.scene.leave();
            return;
        }

        const photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id);
        let file_id='default'
        if (photos && photos.total_count > 0) {
            file_id = photos.photos[0][0].file_id; // Getting the file ID of the latest photo
        }

        // User details
        const userDetails = {
            userId: ctx.from.id, // User's Telegram ID
            firstName: ctx.from.first_name, // User's first name
            lastName: ctx.from.last_name, // User's last name (might be undefined)
            username: ctx.from.username, // User's Telegram username (might be undefined)
            languageCode: ctx.from.language_code, // User's Telegram client's language
            profileImageId: file_id
        };

        try {
            const {rows} = await saveMessage(userDetails, text, false);
            broadcast({messageId: rows[0].id ,message: text, userData: userDetails, fromConsultant: false}); // Broadcast the message to all connected WebSocket clients
        } catch (error) {
            console.error('Error in webhook route:', error);
        }
    });
    chatScene.on('message', (ctx) => {
        const language = ctx.session.language || 'ru';
        ctx.reply(translations[language].textOnly);
    });

    stage.register(chatScene);
    stage.register(suggestionScene);
}

module.exports = setupScenes;