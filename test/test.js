const chai = require('chai');
const expect = chai.expect;
const request = require('supertest');
const listEndpoints = require('express-list-endpoints');
const app = require('../app');

const user = request.agent(app);
const fakeAuthenticatedUser = request.agent(app);


describe('not-logged in user test', (done) => {
  before((done) => {
    console.log(listEndpoints(app));
    done();
  });

  it('router "/" will return 200 response', (done) => {
    user.get('/').end((err, res) => {
      expect(res.statusCode).to.be.equal(200);
      done();
    });
  });

  it('router "/register" will return 200 response', (done) => {
    user.get('/register').end((err, res) => {
      expect(res.statusCode).to.be.equal(200);
      done();
    });
  });

  it('router "/login" will return 200 response', (done) => {
    user.get('/login').end((err, res) => {
      expect(res.statusCode).to.be.equal(200);
      done();
    });
  });

  it('router "POST:/login" will return 500 response', (done) => {
    user.post('/login')
      .send({
        token: "token"
      })
      .end((err, res) => {
        expect(res.statusCode).to.be.equal(500);
        done();
      });
  });

  it('router "/logout" will return 302 response', (done) => {
    user.get('/logout').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/');
      done();
    });
  });

  it('router "POST:/users" will return 500 response', (done) => {
    user.post('/users')
      .send({
        token: "token"
      })
      .end((err, res) => {
        expect(res.statusCode).to.be.equal(500);
        done();
      });
  });

  it('router "/users/delete" will return 500 response', (done) => {
    user.post('/users/delete')
      .send({ token: 'token' })
      .end((err, res) => {
        expect(res.statusCode).to.be.equal(500);
        console.log(res.statusCode);
        done();
      });
  });


  it('router "/home" will return 302 response', (done) => {
    user.get('/home').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/login');
      done();
    });
  });

  it('router "/activity" will return 302 response', (done) => {
    user.get('/activity').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/login');
      done();
    });
  });

  it('router "/settings" will return 302 response', (done) => {
    user.get('/settings').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/login');
      done();
    });
  });

  it('router "/task_management" will return 302 response', (done) => {
    user.get('/task_management').end((err, res) => {
      expect(res.statusCode).to.be.equal(302);
      expect(res.header['location']).to.be.equal('/login');
      done();
    });
  });

});
