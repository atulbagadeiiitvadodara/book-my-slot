const { v4: uuidv4 } = require('uuid');

function nanoid(size = 8) {
  return uuidv4().replace(/-/g, '').slice(0, size);
}

module.exports = { nanoid };
