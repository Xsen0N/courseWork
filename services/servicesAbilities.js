const { AbilityBuilder, Ability } = require('@casl/ability');

function defineAbilitiesFor(user) {
    const { can, rules } = new AbilityBuilder(Ability);
    
    if (user) {
        if (user.role === '0') { // 0 - user
            can('read', 'Masters');
            can('read', 'Masters', { id: user.id }); // Просмотр отдельного мастера по его id
            can('read', 'Types');
            can('read', 'Enrollment');
            can('create', 'Enrollment');
            can('read', 'Scheduler');
            
        } else if (user.role === '1') { // 1 - admin
            can('manage', 'all');
            cannot('create', 'Enrollment');
        }
    } else {
        can('read', 'Masters');
        can('read', 'Types');
        can('read', 'Scheduler');
        can('read', 'Enrollment');
        can('create', 'Enrollment');
    }
    
    return new Ability(rules);
}

import nodemailer from 'nodemailer';


const mailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  secure: true, // Используем SSL/TLS
  port: 465 // Стандартный порт для SSL
};

// Шаблоны писем вынесены в отдельные константы
const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Подтверждение вашей заявки',
    text: (userEmail, specialistName) => 
      `Уважаемый клиент!\n\n` +
      `Благодарим вас за выбор нашей компании! Ваша заявка с адресом ${userEmail} успешно зарегистрирована.\n` +
      `Специалист ${specialistName} свяжется с вами в течение 24 часов для уточнения деталей.\n\n` +
      `С уважением,\nКоманда CourseProject`,
    html: (userEmail, specialistName) => 
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Подтверждение заявки</h2>
        <p>Уважаемый клиент!</p>
        <p>Благодарим вас за выбор нашей компании! Ваша заявка с адресом <strong>${userEmail}</strong> успешно зарегистрирована.</p>
        <p>Специалист <strong>${specialistName}</strong> свяжется с вами в течение 24 часов для уточнения деталей.</p>
        <hr style="border: 1px solid #ecf0f1; margin: 20px 0;">
        <p style="font-size: 0.9em; color: #7f8c8d;">
          С уважением,<br>
          Команда CourseProject
        </p>
      </div>`
  }
};

async function sendServiceConfirmation(userEmail) {
  // Проверка наличия обязательных переменных окружения
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email configuration is incomplete');
  }

  const transporter = nodemailer.createTransport(mailConfig);

  try {
    const specialistName = 'Иван Иванов'; // Можно получать из БД или конфига
    const mailOptions = {
      from: `CourseProject Service <${process.env.EMAIL_USER}>`,
      to: userEmail,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_USER,
      subject: EMAIL_TEMPLATES.WELCOME.subject,
      text: EMAIL_TEMPLATES.WELCOME.text(userEmail, specialistName),
      html: EMAIL_TEMPLATES.WELCOME.html(userEmail, specialistName)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Письмо успешно отправлено:', info.messageId);
    
    // Закрываем соединение
    transporter.close();
    return true;
  } catch (error) {
    console.error('Ошибка отправки письма:', error);
    throw new Error('Произошла ошибка при отправке подтверждения. Пожалуйста, попробуйте позже.');
  }
}
