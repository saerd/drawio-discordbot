const Discord = require('discord.js');
const auth = require('./auth.json');
const words = require('./words.json');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

const NOGAME = 'NOGAME';
const SETUP = 'SETUP';
const PLAYING = 'PLAYING';

const EMOJI = '👍';

let state = {
    playing: NOGAME,
    players: [],

}
console.log(words);

const mention = (user) => {
    return '<@' + user.id + '>';
}

const makeGame = (state, msg) => {
    const user = state.order.shift();
    state.order.push(user);
    const word = words[Math.floor(Math.random()*words.length)];
    user.send('You are now drawing ' + word);
    msg.channel.send(mention(user) + ' is now drawing!');
    return {
        ...state,
        word
    };
}

const processTurn = async (state, msg) => {
    if(msg.content == state.word) {
        return await msg.channel.send(mention(msg.author) + ' got ' + state.word + ' correctly!')
            .then(() => makeGame(state, msg))
            .catch(console.error);
    }
    return Promise.resolve(state);
}

const newGame = async (state, msg) => {
    if(state.playing == NOGAME) {
        return await msg.reply('Okay who is playing? react to this.. and then !start-game after')
            .then((inv) => {
                inv.react(EMOJI).catch(console.error);
                return {
                    ...state,
                    playing: SETUP,
                    players: [],
                    inv
                };
            })
            .catch(console.error);
    }
    msg.reply('State is in ' + state.playing + ', try !end-game');
    return Promise.resolve(state);
};

const startGame = (state, msg) => {
    if(state.playing != SETUP) {
        msg.reply('State is in ' + state.playing);
        return state;
    }
    let order = [];
    let users = {};
    reactions = state.inv.reactions.cache.get(EMOJI);
    reactions.users.cache.forEach((user, id) => {
        if(!user.bot){
            order.push(user);
            users[id] = user;
        }
    });
    if(order.length > 0) {
        msg.channel.send('Users that are playing:\n')
            .then(() => 
                msg.channel.send(order.map((user) => mention(user))))
            .catch(console.error);
        state = {
            ...state,
            playing: PLAYING,
            users,
            order
        };
        return makeGame(state, msg);
    }
    msg.reply('Need at least 2 players');
    return state;
}

const endGame = (state, msg) => {
    if(state.playing != NOGAME) {
        msg.reply('Thanks for playing');
    }
    return {
        ...state,
        playing: NOGAME,
        players: []
    };
};

client.on('message', async (msg) => {
  switch(msg.content) {
      case('!new-game'): 
          state = await newGame(state, msg);
          break;
      case('!end-game'):
          state = endGame(state, msg);
          break;
      case('!start-game'):
          state = startGame(state, msg);
          break;
  }
  if(state.playing == PLAYING){
      state = await processTurn(state, msg);
  }
});

client.login(auth.token);
