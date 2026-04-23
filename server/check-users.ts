// Check users script - to be run with Node.js (not Bun)
import { db } from './db';

type User = {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
};

async function checkUsers() {
  try {
    const allUsers = db.prepare('SELECT * FROM users').all() as User[];
    console.log('\n=== Database Users ===');
    console.log('Total users:', allUsers.length);
    if (allUsers.length > 0) {
      console.log('\nUser details:');
      allUsers.forEach((u: User) => {
        console.log(`- Email: ${u.email}, ID: ${u.id}, Name: ${u.name || '(none)'}, Created: ${new Date(u.created_at).toISOString()}`);
      });
    } else {
      console.log('No users found in database.');
    }
  } catch (err) {
    console.error('Error checking users:', err);
  }
}

checkUsers().catch(console.error);
