set -e

mongo <<EOF
use admin
db.auth('$DB_USERNAME', '$DB_PASSWORD'); // Auth in mongo with provided user
db = db.getSiblingDB('$DB_NAME'); // Create database
// Create user for database according to env variable
db.createUser({
  user: '$DB_USERNAME',
  pwd:  '$DB_PASSWORD',
  roles: [{
    role: 'readWrite',
    db: '$DB_NAME'
  }]
})
EOF
