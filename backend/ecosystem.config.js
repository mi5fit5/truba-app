module.exports = [
  {
    name: 'truba-backend',
    script: 'dist/server.js',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
    },
  },
];