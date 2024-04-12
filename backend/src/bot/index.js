const { Telegraf, Scenes, session, Markup} = require('telegraf');
const setupScenes = require('./scenes');
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([]);
setupScenes(stage);

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


bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    ctx.reply('Выберите язык / Тилни танланг:', Markup.keyboard([
        ['🇷🇺 Русский', '🇺🇿 O\'zbek']
    ]).resize().oneTime());
});

bot.hears(['🇷🇺 Русский', '🇺🇿 O\'zbek'], (ctx) => {
    const language = ctx.message.text.includes('Русский') ? 'ru' : 'uz';
    ctx.session.language = language;
    const name = ctx.from.first_name || "Гость";

    const welcomeMessage = translations[language].greeting(name);

    ctx.reply(welcomeMessage, Markup.keyboard([
        [translations[language].companyInfo],
        [translations[language].addresses],
        [translations[language].call],
        [translations[language].chatWithConsultant],
        [translations[language].socialMedia],
        [translations[language].suggestions],
    ]).resize());
});

bot.hears(['🏘 Посмотреть доступные ЖК', '🏘 Mavjud uy-joy komplekslarni ko\'rish'], (ctx) => {
    const language = ctx.session.language || 'ru'; // Default to Russian if no language is set
    const webAppUrl = 'http://localhost:5173'; // Replace with your actual web app URL

    // Localized text for the button
    const buttonLabel = translations[language].propertiesButton;

    // Send the message with the link to the web app
    ctx.reply('', Markup.button.webApp(buttonLabel, webAppUrl));
});

bot.hears(['🗺 Наши адреса', '🗺 Bizning manzillar'], (ctx) => {
    const language = ctx.session.language || 'ru'; // Default to Russian if no language is set

    // Define the locations with localized text
    const location1 = {
        latitude: 41.348122,
        longitude: 69.338873,
        text: translations[language].salesDepartment,
        yandexMapUrl: 'https://yandex.ru/maps/org/191131417600',
        twoGisMapUrl: 'https://2gis.uz/tashkent/search/bi%20group/firm/70000001082948223/69.338341%2C41.348295?m=69.279857%2C41.31118%2F11'
    };
    const location2 = {
        latitude: 41.284310,
        longitude: 69.266639,
        text: translations[language].centralSalesDepartment,
        yandexMapUrl: 'https://yandex.ru/maps/-/CDBN5JMJ',
        twoGisMapUrl: 'https://2gis.uz/tashkent/search/bi%20group/firm/70000001082526516/69.266838%2C41.284268?m=69.279857%2C41.31118%2F11'
    };

    // Send the information about the first location with localization
    ctx.reply(location1.text, Markup.inlineKeyboard([
        [Markup.button.url(translations[language].yandexMapsLink, location1.yandexMapUrl)],
        [Markup.button.url(translations[language].twoGisMapsLink, location1.twoGisMapUrl)]
    ]));

    // Send the information about the second location
    ctx.reply(location2.text, Markup.inlineKeyboard([
        [Markup.button.url(translations[language].yandexMapsLink, location2.yandexMapUrl)],
        [Markup.button.url(translations[language].twoGisMapsLink, location2.twoGisMapUrl)]
    ]));
});


bot.hears(['ℹ️ Информация о компании', 'ℹ️ Kompaniya haqida ma\'lumot'], (ctx) => {
    const language = ctx.session.language || 'ru'; // Default to Russian if no language is set
    ctx.replyWithMarkdown(translations[language].companyDesc);
});


bot.hears(['📞 Позвонить', '📞 Qo\'ng\'iroq qilish'], (ctx) => {
    const language = ctx.session.language || 'ru';
    ctx.reply(translations[language].callPrompt, Markup.inlineKeyboard([
        [Markup.button.url(translations[language].callButton, 'http://64.23.175.160/?call=true')]
    ]));
});

// Suggestions
bot.hears(['💡 Ваши предложения по улучшению бота', '💡 Botni yaxshilash takliflaringiz'], (ctx) => {
    ctx.scene.enter('suggestionScene');
});

// Chat with a consultant
bot.hears(['💬 Чат с консультантом', '💬 Konsultant bilan suhbat'], (ctx) => {
    ctx.scene.enter('chatScene');
});

bot.hears(['🤳 Социальные сети', '🤳 Ijtimoiy tarmoqlar'], (ctx) => {
    const language = ctx.session.language || 'ru';
    ctx.reply(translations[language].socialNetworks, Markup.inlineKeyboard([
        [Markup.button.url('Instagram', 'https://www.instagram.com/bi.group.tashkent?igsh=engzOHVyaWllZW1q')],
        [Markup.button.url('Telegram', 'https://t.me/BIGROUPUZBEKISTAN')]
    ]));
});


// Export the bot, it can be started from server.js
module.exports = { bot, translations };
