const express = require('express');
const bodyParser = require('body-parser');
const { models } = require('../db/models/initModels');
const jwt = require('jsonwebtoken');
const app = express();

exports.getRegisterPage = (req, res, next) => {
    res.render("./layouts/registration.hbs", { layout: "registration.hbs" });
}

exports.register = async (req, res, next) => {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const existingUser = await models.User.findOne({ where: { username: username } });

        if (existingUser) {
            return res.redirect('/register');
        }
        await models.User.create({ username: username, password: password });
        res.redirect('/login');
    } catch (error) {
        console.error('Error during registration:', error);
        //по-хорошему надо присобачить общий обработчик ошибок
        res.status(500).send('Error during registration');
    }
}
