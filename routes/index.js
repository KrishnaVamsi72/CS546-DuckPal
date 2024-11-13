import postRoutes from './posts.js';
import userRoutes from './users.js';
import sessionRoutes from'./sessions.js';
import authRoutes from './auth.js'
import path from 'path';
import {static as staticDir} from 'express';
const constructorMethod = (app) => {
  app.use('/', authRoutes);
  app.use('/posts', postRoutes);
  app.use('/sessions', sessionRoutes);
  app.use('/users', userRoutes);
  app.get('/about', (req, res) => {
    res.sendFile(path.resolve('static/about.html'));
  });
  app.get('/contact', (req, res) => {
    res.sendFile(path.resolve('static/contact.html'));
  });
  app.get('/admin',(req,res)=>{
    res.sendFile(path.resolve('static/admin.html'));
  })
  app.use('/public', staticDir('public'));
  app.use('*', (req, res) => {
    res.redirect('/');
  });
};

export default constructorMethod;
