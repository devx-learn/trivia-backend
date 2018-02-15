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
    this.socket = opts.socket;
    this.username = opts.username;
    this.questions = opts.questions;
    this.questionIndex = 0;
    this.score = 0;
    this.anwerTimer = null;
    this.nextQuestionTimer = null;
    this.sendQuestion();
  }

  sendQuestion() {
    this.nextQuestionTimer = setTimeout(() => { //once the setTimeout function has started, exicute "sendQuestion"
      this.currentQuestion = this.questions[this.questionIndex]; //pulls from questions.json
      this.currentQuestion.points = ['', 'easy', 'medium', 'hard'].indexOf(this.currentQuestion.difficulty) * 5; //caculates points based off the difficulty of the question by multiplying by the index of an array of 1-3 not including 0
      let answers = shuffle([this.currentQuestion.correct_answer].concat(this.currentQuestion.incorrect_answers)); //shuffles the correct and incorrect answers and combinds them into a new array.
      this.socket.emit('question', { //e
        question: this.currentQuestion.question,
        category: this.currentQuestion.category,
        points: this.currentQuestion.points,
        answers: answers
      });
      this.questionIndex += 1;
      this.questionIndex = this.questionIndex % this.questions.length;

      this.answerTimer = setTimeout(() => {
        this.socket.removeAllListeners('answer');
        this.socket.emit('timeout', this.currentQuestion.correct_answer);
        this.sendQuestion();
      }, 30000)

      this.socket.on('answer', this.checkAnswer.bind(this));
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
    this.questions = require('./questions').results; // will be connected to the fetch of the API
    this.games = {}; // initializes and empty object of games
  }

  onConnect(socket) {
    socket.on('signin', (username) => { //waits for a sign-in even from the front-end
      this.games[socket.id] = new Game({ //
        username: username,
        socket: socket,
        questions: shuffle(this.questions)
      });
    })

    socket.on('disconnect', () => {
      this.games[socket.id].stop();
      delete this.games[socket.id];
    })
  }
}


module.exports = Trivia;
