exports.battle = async (data) => {
  try {

    let sub_strength = 5;
    let user = await User.findOne({where: {vk_id: data.from_id}});
    let vk_user1 = await bot.api('users.get', {user_ids: data.from_id});
    let vk_user2;
    let user2;

  // ERROR HANDLER
    if (user == null) {
      return bot.send(render('error', {
        error: 'not found',
        template: random.int(1, 3),
        first_name: vk_user1[0].first_name,
        last_name: vk_user1[0].last_name,
        id: data.from_id
      }), data.user_id)
    }


    if (user.strength < sub_strength) {
      return bot.send(render('error', {
        error: 'no_strength_bibon',
        template: random.int(1, 3),
        first_name: vk_user1[0].first_name,
        last_name: vk_user1[0].last_name,
        id: data.from_id
      }), data.user_id, {
        disable_mentions: 1
      });
    }

    if (user.biba < 1) {
      return bot.send("Слишком маленькая биба.", data.user_id);
    }

    if (Date.now() - (1000 * 60) < user.bibon) {
      let time = Math.round((user.bibon - (Date.now() - (1000 * 60)) ) / 1000);
      return bot.send(render('error', {
        error: "bibon_error",
        template: random.int(1, 3),
        user: vk_user1[0],
        time: time
      }), data.user_id);
    }
  // END ERROR HANDLER
    if (data.to_id == data.from_id || data.to_id < 0) {
      bot.send('Ищу соперника...', data.user_id);
      let count_users = await User.count();

      do {
        let random_user = random.int(0, (count_users - 1));
        user2 = await User.findOne({ offset: random_user });
      } while (user2.id == user.id);

      vk_user2 = await bot.api('users.get', {user_ids: user2.vk_id, name_case: 'dat'});
    } else {
      user2 = await User.findOne({where: {vk_id: data.to_id}});
      vk_user2 = await bot.api('users.get', {user_ids: data.to_id, name_case: 'dat'});
    }

    let chance = 50;
    let max_bib_abs_win = 50;
    let proc_to_bib = Math.round( (100 / max_bib_abs_win) / 2  );

    let raznica = user.biba - user2.biba;
    chance += raznica * proc_to_bib;
    chance = chance <= 0 ? 1 : chance;
    chance = chance >= 99 ? 98 : chance;
    chance = Math.round(chance);

    let abs_raznica = Math.abs(raznica / 10);

    abs_raznica = abs_raznica < 1 ? 1 : abs_raznica;

    let random_int = random.int(1, 100);
    let status = random_int < chance ? 'win' : 'lose';
    let biba = random.int(25, 50);


    if (status == 'win') {
      if (raznica > 0) { biba = ( biba / abs_raznica ) * 2; }
      if (raznica < 0) { biba = ( biba * abs_raznica ) * 2; }

      let add_money = random.int(-50, 3);
      if (add_money > 0) user.money += add_money;
    }
    else if (status == 'lose') {
      if (raznica > 0) { biba = biba * abs_raznica; }
      if (raznica < 0) { biba = biba / abs_raznica; }
    }


    biba = Math.round(biba) / 100;

    biba = biba < 0.01 ? 0.01 : biba;
    biba = biba > 10 ? 10 : biba;

    user.bibon = Date.now();
    user.strength -= user.strength - sub_strength >= 0 ? sub_strength : user.strength;
    if (status == 'win') user.biba += biba;
    else if (status == 'lose') {
      user.biba -= user.biba - biba >= 0 ? biba : user.biba;
    }
    user.save();


    Bibon.create({
      user_id: user.id,
      opponent_id: user2.id,
      biba: Math.abs(biba),
      result: status == 'win' ? 1 : 0
    });


    bot.send(render('battle', {
      type: status,
      template: random.int(1, 12),
      biba: biba,
      user1: vk_user1[0],
      user2: vk_user2[0],
      chance: chance,
      random_int: random_int
    }), data.user_id, {
      disable_mentions: 1
    });

  } catch (e) {
    console.log(e);
  }
};
