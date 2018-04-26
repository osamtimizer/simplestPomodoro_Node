const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const app = require('../app');

const user = request.agent(app);

describe('not-logged in user test', (done) => {
  it('should return 200 when user is not logged in', (done) => {
    user.get('/login').end((err, res) => {
      expect(res.statusCode).to.be.equal(200);
      done();
    });
  });

  it('should return 302 when user is not logged in', (done) => {
    user.get('/home').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/login');
      console.log(res.header['location']);
      done();
    });
  });
});
