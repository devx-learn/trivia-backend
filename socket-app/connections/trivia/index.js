const SocketApp = require('../../socket-app');
const ANSWER_TIME = 30000; // 30 Seconds

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

class Game {
  constructor(opts) {
    console.log("strting new game");
    this.players = opts.players;
    this.io = opts.io;
    this.questions = opts.questions;
    this.room = opts.room;
    this.questionIndex = 0;
    this.anwerTimer = null;
    this.nextQuestionTimer = null;
    this.sendQuestion();
  }


  sendQuestion() {
    this.nextQuestionTimer = setTimeout(() => {
      this.currentQuestion = this.questions[this.questionIndex];
      this.currentQuestion.points = ['', 'easy', 'medium', 'hard'].indexOf(this.currentQuestion.difficulty) * 5;
      let answers = shuffle([this.currentQuestion.correct_answer].concat(this.currentQuestion.incorrect_answers));
      console.log("sending question");
      this.io.to(this.room).emit('question', {
        question: this.currentQuestion.question,
        category: this.currentQuestion.category,
        points: this.currentQuestion.points,
        answers: answers
      });
      this.questionIndex += 1;
      this.questionIndex = this.questionIndex % this.questions.length;

      this.answerTimer = setTimeout(() => {
        // this.socket.removeAllListeners('answer');
        // this.socket.emit('timeout', this.currentQuestion.correct_answer);
        // this.sendQuestion();
      }, 30000)
console.log("sending question to room " + this.room);
      this.io.sockets.in(this.room).on('answer', this.checkAnswer.bind(this));
    }, 2000)
  }

  checkAnswer(answer) {
    clearTimeout(this.answerTimer);
    this.socket.removeAllListeners('answer');
    if (answer === this.currentQuestion.correct_answer) {
      this.score += this.currentQuestion.points;
      this.socket.emit('right', this.score);
    } else {
      this.socket.emit('wrong', this.currentQuestion.correct_answer);
    }
    this.sendQuestion();
  }

  stop() {
    clearTimeout(this.answerTimer);
    clearTimeout(this.nextQuestionTimer);
  }
}

class Trivia extends SocketApp {
  constructor(io, connectionName) {
    super(io, connectionName);
    this.io = io;
    this.questions = require('./questions').results;
    this.games = []; // creates an empty array of game rooms
    this.gameId = 0; // creates a UUI for the game room
    this.players = [] // creates an empty array of playes
  }

  onConnect(socket) {
    if (this.players.length < 4) {
      socket.on('signin', (username) => {


        this.players.push({
          username: username,
          socket: socket,
          score: 0
        })

        socket.join('game-' + this.gameId) //makes a unique id for game
        socket.emit('waiting')

        if (this.players.length === 1) { // determins how many players can play a single game
          this.games.push(new Game({ //exicutes "game" component
            io: this.io, // creates a new UUI game id
            room: 'game-' + this.gameId,
            players: this.players,
            questions: shuffle(this.questions)
          }))
          this.gameId++;
        }
      })
    }
    socket.on('disconnect', () => {})
  }

}


module.exports = Trivia;
