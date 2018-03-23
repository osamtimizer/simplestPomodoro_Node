import $ from 'jquery';
import firebase from 'firebase';
import Chart from 'chart.js'
import Moment from 'moment'

let config = {
  apiKey: "AIzaSyDUBdU1s_1ff_yUxXvlCbS9y4JyocdaShk",
  authDomain: "simplestpomodoro.firebaseapp.com",
  databaseURL: "https://simplestpomodoro.firebaseio.com",
  storageBucket: "simplestpomodoro.appspot.com",
};
firebase.initializeApp(config);

const auth = firebase.auth();

$(() => {
  const context = $('#myChart')[0].getContext('2d');
  const myChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
      datasets: [{
        label: 'apples',
        data: [12, 19, 3, 17, 6, 3, 7],
        backgroundColor: 'rgba(153,255,51,0,4)'
      }, {
        label: 'oranges',
        data: [2, 29, 5, 5, 2, 3, 10],
        backgroundColor: 'rgba(255,153,0,0,4)'
      }]
    }
  });
});

