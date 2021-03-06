const pug = require('pug');
const path = require('path');
const fs = require('fs');

global.stack_messages = []; // Сообщения ожидающие отправку!
global.render = (name, data = {}) => {
  return pug.renderFile(`./views/${name}.pug`, data);
}
global.send = async (content, peer_id, param = {}) => {
  bot.options.api = { v: "5.103" }
  try { await bot.send(content, peer_id, Object.assign(param, {random_id: Date.now()})); }
  catch (e) { return e; }
  bot.options.api = { v: "5.80" }
  return true;
}
global.pre_send = async (content, peer_id, param = {}) => {
  global.stack_messages.push({
    send_id: peer_id,
    content: content,
    param: param,
    attempt: 0
  });
}
global.get_keyboard = async (name, inline = true) => {
  let keyboard = await require('../views/Keyboards/' + name + '.js').index();
  keyboard.obj.inline = inline;
  return keyboard;
}
global.init_models = async () => {
  fs.readdir('./models', function (err, files) {
    global.models = [];
    files.forEach(function (file) {
      let file_name = file.split('.')[0];
        global.models[file_name] = require(`../models/${file}`);
    });
  });
}
global.init_events = async () => {
  fs.readdir('./events', function (err, files) {
    global.events = [];
    files.forEach(function (file) {
      let file_name = file.split('.')[0];
        global.events[file_name] = require(`../events/${file}`);
    });
  });
}
global.init_actions = async () => {
  fs.readdir('./actions', function (err, files) {
    global.actions = [];
    files.forEach(function (file) {
      let file_name = file.split('.')[0];
        global.actions[file_name] = require(`../actions/${file}`);
    });
  });
}
global.init_middleware = async () => {
  fs.readdir('./middleware', function (err, files) {
    global.middleware = [];
    files.forEach(function (file) {
      let file_name = file.split('.')[0];
      global.middleware[file_name] = require(`../middleware/${file}`);
    });
  });
}
global.init_shop = async () => {
  fs.readdir('./shop/products', function (err, files) {
    global.products = [];
    files.forEach(async function (file) {
      let file_name = file.split('.')[0];
      global.products[file_name] = require(`../shop/products/${file}`);
    });
    global.shop = require(`../shop/init`);
    global.shop.index();
  });
}
global.init_app = async () => {
  init_middleware();
  init_models();
  init_events();
  init_actions();
  init_shop();
}
// Перемешивание массива
global.shuffle = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
global.uploadPhotoToVk = async (buffer) => {
  const { v4: uuidv4 } = require('uuid');
  let filename = uuidv4() + '.png';
  fs.writeFileSync('generated/'+filename, buffer);
  let photo = await bot.uploadPhoto('generated/'+filename);
  fs.unlinkSync('generated/'+filename);
  return photo;
}
